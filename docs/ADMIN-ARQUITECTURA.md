# Admin Papelería Store (Resumen de implementación)

Este documento resume lo implementado en el panel de administración para que el equipo entienda rápidamente qué se construyó, cómo funciona y qué sigue.

---

## Qué se implementó en esta fase

Se implementó un módulo admin funcional conectado a Hostinger:

1. Se crearon rutas para admin:
   - `/admin/login`
   - `/admin`
2. Se protegió `/admin` con una ruta protegida (`AdminRoute`) que revisa token en `localStorage`.
3. Se construyó la pantalla de login admin y se conectó con PHP (`admin_login.php`).
4. Se construyó el dashboard admin y se conectó a MySQL vía PHP (`admin_products_list.php`).
5. Se corrigieron problemas de tipos/parseo (por ejemplo `price` recibido como string desde PHP).
6. Se aplicó seguridad básica:
   - CORS por lista blanca (localhost + dominio)
   - respuestas de error sin exponer detalles sensibles de base de datos
7. Se implementó edición real de productos:
   - botón `Editar` por fila
   - formulario de edición
   - guardado real en DB vía `admin_product_update.php`
8. Se implementó creación real de productos:
   - formulario `Crear producto` en el dashboard
   - carga de categorías activas desde API
   - guardado real en DB vía `admin_product_create.php`
9. Se implementó eliminación de productos:
   - botón `Eliminar` por fila con confirmación
   - eliminación física del registro en DB
   - eliminación previa de imágenes relacionadas
   - endpoint dedicado `admin_product_delete.php`
10. Se implementó validación de sesión en backend:
   - login crea sesión en `admin_sessions`
   - endpoints protegidos exigen token Bearer
   - logout revoca sesión con `admin_logout.php`
   - helpers centralizados en `_admin_common.php`
11. Se implementó módulo de ofertas:
   - activar/quitar oferta por producto
   - listado dedicado de ofertas activas en admin
   - cálculo y visualización de precio original, precio oferta y ahorro
12. Se implementó módulo de ingresos:
   - resumen del día (total vendido, unidades y número de ventas)
   - detalle por producto cuando existen tablas de ventas
13. Se conectó la tienda al backend:
   - listado público desde `products_list_public.php`
   - catálogo y detalle ya no dependen solo de `products.ts`
14. Se implementó carga de imagen por archivo desde admin:
   - endpoint `admin_product_image_upload.php`
   - almacenamiento en `api/uploads/products/`
   - opción dual en admin: URL manual o archivo local

---

## Cómo funciona el flujo (explicado simple)

### 1) Login admin

El usuario escribe contraseña en `/admin/login`.

El frontend llama a:
- `POST /api/admin_login.php`

Si las credenciales son correctas:
- el backend devuelve token
- el backend registra sesión en tabla `admin_sessions`
- el frontend guarda `adminToken` en `localStorage`
- se redirige a `/admin`

### 2) Dashboard admin

Al entrar a `/admin`:
- `AdminRoute` valida que exista `adminToken`
- se llama a `GET /api/admin_products_list.php`
- se renderiza tabla de productos
- cada endpoint valida token en backend antes de responder

### 3) Editar producto

En la tabla se da clic en `Editar`:
- se abre formulario con datos actuales
- se cambian nombre/precio/stock/mayoreo/menudeo
- se envía a:
  - `POST /api/admin_product_update.php`
- el backend actualiza en `products` y devuelve producto actualizado
- el frontend actualiza la fila sin recargar toda la página

### 4) Crear producto

En el formulario de alta:
- se capturan nombre, categoría, precio, stock y flags mayoreo/menudeo
- se consultan categorías con:
  - `GET /api/admin_categories_list.php`
- se crea el producto con:
  - `POST /api/admin_product_create.php`
- el backend inserta en `products`, genera slug único y devuelve el producto creado
- el frontend agrega la nueva fila al inicio de la tabla

### 5) Eliminar producto

En la tabla se da clic en `Eliminar`:
- se muestra confirmación en frontend
- se envía a:
  - `POST /api/admin_product_delete.php`
- el backend elimina primero `product_images` relacionados
- el backend elimina el producto en `products`
- el frontend quita la fila de la tabla (sin recargar)
- al consultar `products` en phpMyAdmin, el registro ya no aparece

### 6) Gestionar ofertas

En productos se puede usar `Poner oferta`:
- el frontend envía precio oferta a:
  - `POST /api/admin_offer_upsert.php`
- el backend valida que oferta < precio actual
- se guarda/actualiza en `product_offers`
- la tienda muestra porcentaje real y precio tachado

Para quitar oferta:
- `POST /api/admin_offer_remove.php`
- no borra el producto, solo desactiva la oferta

### 7) Subir imagen local (archivo)

En crear/editar producto:
- se puede seleccionar archivo (`JPG`, `PNG`, `WEBP`, `GIF`, máx 5MB)
- el frontend sube con:
  - `POST /api/admin_product_image_upload.php` (multipart/form-data)
- el backend guarda archivo en:
  - `public_html/api/uploads/products/`
- el formulario recibe URL pública y la guarda en `product_images`

### 8) Tienda pública conectada a DB

La tienda consulta:
- `GET /api/products_list_public.php`

Con esto:
- productos nuevos del admin aparecen en `/all-products`
- descuentos se reflejan en badges y precio original tachado
- el detalle de producto usa datos reales del endpoint público

---

## Archivos clave modificados

### Frontend (React/Vite)

- `src/App.tsx`  
  Se agregaron rutas admin y se ocultó layout público en `/admin/*`.

- `src/components/admin/AdminRoute.tsx`  
  Se protegió el dashboard revisando `adminToken`.

- `src/pages/AdminLogin.tsx`  
  Se implementó UI de login e integración con API de autenticación.

- `src/pages/AdminDashboard.tsx`  
  Se implementó dashboard modular (Resumen, Productos, Ofertas, Ingresos), CRUD, ofertas, alertas de stock y carga de imagen por archivo.

- `src/services/adminApi.ts`  
  Se centralizó login/listado/update/create/delete, ofertas, ingresos y subida de imagen de producto.

- `src/services/storeApi.ts`
  Se conectó la tienda al endpoint público y se normalizaron precios/ofertas.

- `src/styles/admin.css`  
  Se implementaron estilos del login y dashboard admin.

### Backend (PHP en Hostinger)

- `api/admin_login.php`
- `api/admin_products_list.php`
- `api/admin_product_update.php`
- `api/admin_categories_list.php`
- `api/admin_product_create.php`
- `api/admin_product_delete.php`
- `api/admin_logout.php`
- `api/_admin_common.php`
- `api/admin_offers_list.php`
- `api/admin_offer_upsert.php`
- `api/admin_offer_remove.php`
- `api/admin_sales_today.php`
- `api/admin_product_image_upload.php`
- `api/products_list_public.php`

Se configuraron estos endpoints con CORS por lista blanca y manejo seguro de errores.

---

## Qué subir a Hostinger para verlo en HTTPS

## Frontend
1. Crear `.env` local con:
   - `VITE_API_URL=https://godart-papelería.com/api`
2. Ejecutar build:
   - `npm run build`
3. Subir contenido de `dist/` a `public_html/`

## API PHP
Subir a `public_html/api/`:
- `_admin_common.php`
- `admin_login.php`
- `admin_logout.php`
- `admin_products_list.php`
- `admin_product_update.php`
- `admin_categories_list.php`
- `admin_product_create.php`
- `admin_product_delete.php`
- `admin_offers_list.php`
- `admin_offer_upsert.php`
- `admin_offer_remove.php`
- `admin_sales_today.php`
- `admin_product_image_upload.php`
- `products_list_public.php`

Además, asegurar carpeta:
- `public_html/api/uploads/products/` (con permisos de escritura)

Confirmar credenciales de DB:
- en `_admin_common.php`

---

## Seguridad mínima aplicada

- CORS restringido (ya no está en `*`)
- Errores internos no expuestos al cliente
- Hash de contraseña admin con `password_hash` / `password_verify`
- Sesiones persistidas y revocables en backend (`admin_sessions`)
- Endpoints protegidos con token Bearer
- Subida de archivo con validación de tamaño y tipo MIME

---

## Pendientes (siguiente fase)

1. Rate-limit de login (anti fuerza bruta)
2. Módulos de categorías y banners
3. Dashboard con métricas/filtros

---

## Nota para el equipo

Este panel ya no es solo un prototipo visual: está conectado a Hostinger y actualiza la base real.  
Si se cambia dominio o endpoints, revisar primero `VITE_API_URL` y la lista de CORS en PHP.

