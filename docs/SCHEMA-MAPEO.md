# Mapeo: Schema DB ↔ Frontend

Documento que explica cómo el esquema de base de datos se relaciona con el frontend actual y qué cambios se hicieron respecto al esquema original.

---

## Resumen de cambios sobre tu DBML original

| Tabla original | Cambios | Motivo |
|----------------|---------|--------|
| **roles** | `created_at` con default | Consistencia |
| **users** | Sin cambios | — |
| **categories** | + `parent_id`, `slug`, `icon`, `color`, `display_order` | Jerarquía Navbar (Escolar → Cuadernos, Estuches...); iconos y orden |
| **products** | + `slug`, `brand`, `mayoreo`, `menudeo` | SEO; FilterPanel filtra por brand; frontend usa mayoreo/menudeo |
| **product_images** | + `display_order` | Orden de galería |
| **offers** | + `badge_type`, `badge_value` | Frontend usa badges (-20%, HOT) además del descuento |
| **offer_products** | + `original_price` | Precio tachado cuando no se calcula solo con el descuento |
| **orders / order_items** | Sin cambios relevantes | — |
| **NUEVO** | **banners** | Carrusel principal del Home |
| **NUEVO** | **home_sections** | Secciones configurables (Destacados, Arte, Escolar) |
| **NUEVO** | **cart_items** | Carrito persistido para usuarios autenticados |

---

## Mapeo Frontend → Base de datos

### 1. Product (frontend) → `products` + `product_images` + `offers`

| Campo frontend | Origen en DB |
|----------------|--------------|
| `id` | `products.id` |
| `name` | `products.name` |
| `price` | `products.price` (o precio con descuento si hay oferta activa) |
| `category` | `categories.name` (join por `products.category_id`) |
| `description` | `products.description` |
| `image` | `product_images.image_url` donde `is_primary = true` |
| `stock` | `products.stock` |
| `mayoreo` | `products.mayoreo` |
| `menudeo` | `products.menudeo` |

**Badge y precio original** (ProductDetail, ProductCard): se obtienen de `offers` + `offer_products` (offer activa por fechas, `original_price` o calculado).

---

### 2. Navbar CATEGORIES → `categories` (jerárquico)

Frontend actual:
```typescript
{ id: "escolares", label: "Útiles Escolares", icon: "fas fa-book", items: [
  { name: "Cuadernos", icon: "fas fa-book", color: "#FF6B9D" }, ...
]}
```

En DB:
- **Padres**: `parent_id = null` (Escolar, Escritura, Papelería, Arte)
- **Hijos**: `parent_id = id del padre` (Cuadernos, Estuches, etc.)
- `icon` y `color` en cada categoría

La API puede devolver categorías ya agrupadas para el Navbar.

---

### 3. Carusel (banner) → `banners`

| Campo frontend | Campo DB |
|----------------|----------|
| `title` | `banners.title` |
| `subtitle` | `banners.subtitle` |
| `price` | `banners.price_display` |
| `oldPrice` | `banners.old_price_display` |
| `sku` | `banners.sku` |
| `image` | `banners.image_url` |
| `bg` | `banners.background_css` |
| `badge` | `banners.badge` |
| `description` | `banners.description` |
| `icon` | `banners.icon` |

Orden: `display_order`. Solo banners con `is_active = true`.

---

### 4. Home (secciones) → `home_sections`

| Sección actual | Tipo | En DB |
|----------------|------|-------|
| Productos Destacados | carousel | `type='carousel'`, `product_ids=[1,2,3,4,5,6]` |
| Arte & Manualidades | carousel | `type='carousel'`, `category_id=Arte` |
| Útiles Escolares | carousel | `type='carousel'`, `category_id=Escolar` |
| Grid de productos | grid | `type='grid'`, `product_ids` o `category_id` |

---

### 5. FilterPanel → `products.brand`, `products.mayoreo`, `products.menudeo`

- **Marcas**: `SELECT DISTINCT brand FROM products WHERE is_active = true`
- **Mayoreo / Menudeo**: filtros directos sobre `products.mayoreo` y `products.menudeo`

---

### 6. Carrito → `cart_items` (usuarios) o localStorage (visitantes)

- Usuario logueado: CRUD en `cart_items` por `user_id`
- Visitante: seguir usando `localStorage`; al hacer login se puede sincronizar

---

## Ejemplo de datos iniciales (seed)

### roles
```sql
INSERT INTO roles (name) VALUES ('admin'), ('user');
```

### categories (jerarquía)
```sql
-- Padres
INSERT INTO categories (name, slug, icon, display_order) VALUES
  ('Útiles Escolares', 'escolares', 'fas fa-book', 1),
  ('Escritura', 'escritura', 'fas fa-pencil-alt', 2),
  ('Papelería', 'papeleria', 'fas fa-file', 3),
  ('Arte & Manualidades', 'arte', 'fas fa-palette', 4);

-- Hijos (parent_id = 1 para Escolares)
INSERT INTO categories (parent_id, name, slug, icon, color, display_order) VALUES
  (1, 'Cuadernos', 'cuadernos', 'fas fa-book', '#FF6B9D', 1),
  (1, 'Estuches', 'estuches', 'fas fa-briefcase', '#C44569', 2),
  ...
```

---

## Compatibilidad con tu esquema original

Si prefieres no usar jerarquía en categorías:
- Quitar `parent_id` de `categories`
- Representar "items" del Navbar como categorías planas con `display_order`
- O añadir tabla `category_items` separada para los ítems del dropdown

Si prefieres no usar `cart_items`:
- Usar `orders` con `status = 'cart'` y convertirlo a `pending` en checkout.

Si quieres mantener `offers` más simple:
- Quitar `badge_type` y `badge_value` y calcular el badge en backend según `discount_type` y `discount_value`.
