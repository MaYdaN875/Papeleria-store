# Prompt: Estructuración del Backend y Planificación del CMS

Documento para iniciar el diseño del backend, el panel de control (CMS) y mejoras sobre los componentes existentes del proyecto Papelería Store (God Art / PaperHub).

---

## 1. Estado actual del frontend

### Stack
- **React 18** + **TypeScript** + **Vite**
- **React Router 7**
- **localStorage** para carrito (sin persistencia en servidor)
- Sin autenticación real (páginas Login/SignUp presentes pero sin backend)
- Datos estáticos en `src/data/products.ts`

### Estructura de componentes (refactorizada)
```
components/
├── ui/           → QuantitySelector, QuantitySteppers, Notification
├── layout/       → Navbar, Footer, SearchBar, MobileBottomNav, FloatingWhatsAppButton
├── cart/         → CartEmpty, CartItem
├── product/      → ProductCard, ProductCarousel, ProductCarouselSlide
├── product-detail/
├── filters/      → FilterPanel, CategoryDropdown, CategoryFilters
└── carousel/     → Carusel (banner)
```

### Datos hardcodeados que deben migrar a backend
| Ubicación | Dato | Uso |
|-----------|------|-----|
| `data/products.ts` | Productos | Catálogo principal |
| `Home.tsx` | FEATURED_IDS, CAROUSEL_CONFIG | Productos destacados y badges |
| `carousel/Carusel.tsx` | bannerOffers | Carrusel principal |
| `layout/Navbar.tsx` | CATEGORIES | Menú de categorías |
| `ProductDetail.tsx` | ORIGINAL_PRICES | Precios tachados |
| `FilterPanel` | brands (derivado de products) | Filtros |

### Modelo de datos actual (Product)
```typescript
type Product = {
  id: number
  name: string
  price: number
  category: string
  description: string
  image: string
  stock: number
  mayoreo?: boolean
  menudeo?: boolean
}
```

### Flujos sin backend
- Carrito: solo localStorage
- Login/SignUp: UI presente, sin API
- Productos, banners, categorías: archivos estáticos

---

## 2. Prompt para estructurar el backend

```
Contexto: E-commerce de papelería (God Art / PaperHub). 
Frontend React + TypeScript + Vite. Datos en archivos estáticos.

Objetivos del backend:
1. API REST (o GraphQL) para productos, categorías, banners, configuración de Home
2. Carrito persistido por usuario (requiere auth)
3. Panel de administración (CMS) para gestionar productos, banners, secciones
4. Autenticación JWT para admin y usuarios (login/signup)

Entidades principales:
- Products (id, name, price, category, description, image, stock, mayoreo, menudeo, slug, createdAt)
- Categories (id, name, slug, icon, order)
- Banners (id, title, subtitle, price, oldPrice, image, bg, badge, order, active)
- HomeSection (id, type: 'carousel'|'grid', title, productIds, category, limit, order, visible)
- Users (para auth)
- Cart / Order (futuro checkout)

Stack sugerido: Node.js + Express (o Fastify) + Prisma + PostgreSQL (o SQLite para MVP).
Alternativa: Supabase para auth + DB + storage.
```

### Endpoints sugeridos para el backend

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/products | Listar productos (filtros: category, minPrice, maxPrice) |
| GET | /api/products/:id | Producto por id o slug |
| GET | /api/categories | Listar categorías |
| GET | /api/banners | Banners activos del carrusel |
| GET | /api/home-sections | Configuración de secciones de Home |
| POST | /api/auth/login | Login |
| POST | /api/auth/signup | Registro |
| GET/POST | /api/cart | Carrito del usuario (requiere auth) |

---

## 3. Planificación del CMS (panel de control)

### Módulos del CMS

| Módulo | Funcionalidad | Prioridad |
|--------|---------------|-----------|
| **Productos** | CRUD, imágenes, categoría, stock, mayoreo/menudeo | Alta |
| **Categorías** | CRUD, orden, icono | Alta |
| **Banners** | CRUD del carrusel principal, orden, activo/inactivo | Alta |
| **Home** | Orden de secciones, visibilidad, títulos, IDs de productos destacados | Media |
| **Usuarios** | Listar, roles (admin/user) | Media |
| **Pedidos** (futuro) | Ver pedidos, estados | Baja |

### Arquitectura del CMS

```
Opción A: Mismo proyecto, ruta /admin
  - App detecta path /admin/* y renderiza layout CMS
  - Protección: verificar token admin

Opción B: Proyecto separado (admin.papeleria.com)
  - React/Vite o Next.js
  - Consume la misma API
  - Auth con rol admin
```

### Ideas para mejorar la programación del CMS

1. **Rutas protegidas**: `ProtectedRoute` que redirige a `/login` si no hay token admin
2. **Layout reutilizable**: Sidebar + header comunes; contenido por ruta
3. **Formularios**: Usar biblioteca (React Hook Form + Zod) para validación
4. **Imágenes**: Subida a storage (S3, Cloudinary) y guardar URL en DB
5. **Drag & drop**: Para ordenar banners y secciones de Home
6. **Preview en vivo**: Mostrar cómo se verá el cambio en la tienda antes de publicar
7. **Roles**: admin (CRUD total), editor (solo productos/banners)

---

## 4. Ideas para mejorar componentes existentes

### Componentes del frontend (tienda)

| Componente | Mejora propuesta |
|------------|------------------|
| **ProductCard** | Añadir prop `layout?: 'grid' \| 'list'` para vista compacta en listas |
| **ProductCarousel** | Soportar `config` desde API (título, productoIds) en lugar de props fijas |
| **Carusel (banner)** | Recibir `banners` por props desde hook `useBanners()` que llame a API |
| **FilterPanel** | Recibir `categories` y `brands` desde API en lugar de derivar de products |
| **Home** | Usar `useHomeSections()` que devuelva secciones configurables; cada sección renderiza ProductCarousel o grid según tipo |
| **SearchBar** | Búsqueda por API (`/api/products?q=...`) cuando exista backend |
| **Cart** | Persistir en backend si hay usuario autenticado; seguir usando localStorage para visitantes |
| **ProductDetail** | Mostrar `originalPrice` desde API si existe; eliminar ORIGINAL_PRICES hardcodeado |

### Capa de datos en el frontend

1. **Hooks de datos**: `useProducts()`, `useProduct(id)`, `useCategories()`, `useBanners()`, `useHomeSections()`
2. **Fallback**: Si la API falla o no existe, usar datos estáticos (modo desarrollo)
3. **Cache**: React Query o SWR para cache y revalidación

### Preparación para API (sin romper lo actual)

```typescript
// services/products.ts
const API_BASE = import.meta.env.VITE_API_URL || ''

export async function fetchProducts(): Promise<Product[]> {
  if (!API_BASE) return products  // fallback a data estático
  const res = await fetch(`${API_BASE}/api/products`)
  if (!res.ok) return products
  return res.json()
}
```

---

## 5. Resumen ejecutivo (orden sugerido)

1. **Fase 1 – Backend base**: API de productos y categorías; BD + Prisma/TypeORM
2. **Fase 2 – Auth**: Login/signup real; JWT; roles
3. **Fase 3 – Frontend + API**: Hooks `useProducts()`, `useCategories()`; sustituir imports estáticos
4. **Fase 4 – CMS (productos y categorías)**: Panel para CRUD de productos y categorías
5. **Fase 5 – Banners y Home**: API de banners y home-sections; CMS para editarlos
6. **Fase 6 – Carrito persistido**: Endpoint de carrito; sincronizar con localStorage cuando el usuario inicie sesión

---

## 6. Checklist antes de empezar el backend

- [ ] Definir stack (Node/Express, Fastify, o Supabase)
- [ ] Esquema de BD (products, categories, banners, home_sections, users)
- [ ] Variables de entorno (DATABASE_URL, JWT_SECRET, VITE_API_URL)
- [ ] CORS configurado para el origen del frontend
- [ ] Documentación OpenAPI o Swagger (opcional)
- [ ] Estrategia de imágenes: upload a storage o URLs externas

---

*Documento de referencia para la planificación del backend y CMS de Papelería Store.*
