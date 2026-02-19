# Arquitectura del módulo Admin

Este documento describe la arquitectura actual del panel administrativo y su integración con la tienda pública.

---

## 1) Resumen funcional

El módulo admin permite:

- autenticación de administrador con sesión en backend,
- gestión completa de productos (CRUD),
- carga de imágenes por URL o archivo local,
- gestión de ofertas por producto,
- consulta de ingresos del día,
- configuración de carruseles de home por producto (`1`, `2`, `3`),
- administración de slides principales del banner home.

La tienda pública consume datos en tiempo real desde API PHP + MySQL.

---

## 2) Estructura backend (API)

La API se organiza por dominio.

### `api/core/`

Helpers compartidos:

- `config.php`: credenciales DB y orígenes permitidos
- `response.php`: respuesta JSON uniforme
- `cors.php`: CORS y control de método HTTP
- `db.php`: conexión PDO y helpers de esquema
- `auth.php`: token Bearer, validación y revocación de sesiones
- `catalog.php`: helpers SQL y normalización de catálogo

### `api/admin/` (requiere sesión admin)

- `auth/login.php`
- `auth/logout.php`
- `products/list.php`
- `products/create.php`
- `products/update.php`
- `products/delete.php`
- `products/image_upload.php`
- `categories/list.php`
- `offers/list.php`
- `offers/upsert.php`
- `offers/remove.php`
- `sales/today.php`
- `slides/list.php`
- `slides/create.php`
- `slides/delete.php`

### `api/public/` (sin sesión)

- `products.php`
- `slides.php`

### Compatibilidad

- `_admin_common.php` actúa como cargador central de helpers.

---

## 3) Estructura frontend (admin)

### Rutas

- `/admin/login`
- `/admin`

### Componentes y servicios clave

- `src/pages/AdminLogin.tsx`
- `src/pages/AdminDashboard.tsx`
- `src/services/adminApi.ts`
- `src/services/api/base.ts`
- `src/types/admin.ts`
- `src/utils/validation.ts`

`AdminDashboard` está dividido por secciones de UI:

- Resumen
- Productos
- Inicio (Slides)
- Ofertas
- Ingresos

---

## 4) Flujo de autenticación

1. El usuario accede a `/admin/login`.
2. Frontend envía credenciales a `POST /api/admin/auth/login.php`.
3. Backend valida usuario y crea sesión en `admin_sessions`.
4. Frontend guarda token y habilita navegación al dashboard.
5. Endpoints admin exigen `Authorization: Bearer <token>`.
6. Logout revoca sesión con `POST /api/admin/auth/logout.php`.

---

## 5) Flujo de productos

### Listado

- `GET /api/admin/products/list.php`

Devuelve catálogo admin con:

- datos base del producto,
- categoría,
- precio de oferta (si aplica),
- imagen principal,
- slot de carrusel home (`home_carousel_slot`).

### Crear

- `POST /api/admin/products/create.php`

Valida payload, crea producto, asigna imagen y slot de carrusel.

### Editar

- `POST /api/admin/products/update.php`

Actualiza datos, imagen principal y slot de carrusel.

### Eliminar

- `POST /api/admin/products/delete.php`

Elimina producto y limpia relaciones necesarias.

### Imagen por archivo

- `POST /api/admin/products/image_upload.php` (multipart/form-data)

Valida tipo/tamaño y guarda en `api/uploads/products/`.

---

## 6) Flujo de ofertas

- `GET /api/admin/offers/list.php`
- `POST /api/admin/offers/upsert.php`
- `POST /api/admin/offers/remove.php`

Regla clave: quitar oferta no elimina el producto.

---

## 7) Flujo de ingresos

- `GET /api/admin/sales/today.php`

Entrega:

- total vendido del día,
- unidades vendidas,
- número de ventas,
- desglose por producto.

---

## 8) Home: carruseles y slides

### Carruseles por producto

Cada producto puede asignarse a:

- Carrusel 1 (destacados),
- Carrusel 2 (arte/manualidades),
- Carrusel 3 (oficina/escolares),
- o sin carrusel.

El home prioriza esa asignación y completa faltantes con productos del catálogo.

### Slides del banner principal

Admin:

- `GET /api/admin/slides/list.php`
- `POST /api/admin/slides/create.php`
- `POST /api/admin/slides/delete.php`

Público:

- `GET /api/public/slides.php`

Si no hay slides activos, el frontend usa fallback visual.

---

## 9) Tablas relevantes

- `admin_users`
- `admin_sessions`
- `products`
- `categories`
- `product_images`
- `product_offers`
- `home_carousel_assignments`
- `home_slides`

Todas se gestionan desde `setup.sql` (con `IF NOT EXISTS` para despliegues seguros).

---

## 10) Deploy y operación

### Requisitos al subir a Hostinger

1. Subir carpeta `api/` completa.
2. Verificar `api/core/config.php` (credenciales y CORS).
3. Ejecutar `setup.sql` en phpMyAdmin.
4. Subir frontend `dist/` actualizado.
5. Verificar endpoints públicos:
   - `/api/public/products.php`
   - `/api/public/slides.php`

### Recomendación operativa

Conservar respaldo de `api/uploads/products/` antes de reemplazar carpeta `api` en producción.
