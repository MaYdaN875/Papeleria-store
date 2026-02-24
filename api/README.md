# Archivos PHP para el Panel Admin

Estos archivos van en tu servidor Hostinger, dentro de `public_html/api/`

## Estructura organizada (actual)

- `_admin_common.php` - Cargador central de helpers (compatibilidad)
- `core/` - Módulos por responsabilidad (`config`, `response`, `cors`, `db`, `auth`, `catalog`)
- `admin/auth/login.php` - Login administrador
- `admin/auth/logout.php` - Logout administrador
- `admin/products/list.php` - Listar productos admin
- `admin/products/create.php` - Crear producto
- `admin/products/update.php` - Editar producto
- `admin/products/delete.php` - Eliminar producto
- `admin/products/image_upload.php` - Subir imagen producto
- `admin/categories/list.php` - Listar categorías admin
- `admin/offers/list.php` - Listar ofertas activas
- `admin/offers/upsert.php` - Crear/actualizar oferta
- `admin/offers/remove.php` - Quitar oferta
- `admin/sales/today.php` - Ingresos del día
- `admin/slides/list.php` - Listar slides de home
- `admin/slides/create.php` - Crear slide de home
- `admin/slides/delete.php` - Eliminar slide de home
- `public/products.php` - Catálogo público de tienda
- `public/slides.php` - Slides públicos para banner home
- `public/auth/login.php`, `register.php`, `me.php`, `logout.php`, etc. - Autenticación cliente (tienda)
- `public/checkout/create-session.php` - Crear sesión Stripe Checkout (cliente autenticado)
- `public/webhooks/stripe.php` - Webhook Stripe (marca órdenes como pagadas)
- `public/orders/list.php`, `public/orders/get.php` - Listar y ver detalle de órdenes del cliente
- `setup.sql` - SQL para crear/actualizar tablas (`admin_sessions`, `product_offers`, `home_carousel_assignments`, `home_slides`)
- `generar_hash.php` - Script temporal para hash de contraseñas (borrar después de usar)

## Pasos rápidos

1. **Sube estos archivos** a `public_html/api/` en Hostinger (incluye carpeta `core/`)
   - Puedes omitir `README.md` en servidor.
2. **Edita** `core/config.php`:
   - Cambia `TU_USUARIO_DB` por tu usuario de base de datos
   - Cambia `TU_PASSWORD_DB` por tu contraseña de base de datos
   - (Los encuentras en: Panel Hostinger → Bases de datos → Detalles)
3. **Ejecuta** `setup.sql` en phpMyAdmin para crear/actualizar tablas de admin, sesiones, ofertas, carruseles y slides
   - `setup.sql` no necesita permanecer en servidor después de ejecutarse.
4. **Configura** `.env` en tu proyecto React con `VITE_API_URL=https://tu-dominio.com/api`

## Pasarela de pagos (Stripe)

- Ejecuta la migración `prompt/migration_orders_stripe.sql` en tu BD para crear tablas `orders` y `order_items`.
- **Sin Composer (Hostinger):** Descarga el ZIP de [stripe-php en GitHub Releases](https://github.com/stripe/stripe-php/releases), descomprímelo y sube la carpeta como `api/stripe-php/` (debe existir `api/stripe-php/init.php`).
- Con Composer: en la carpeta `api` ejecuta `composer install`.
- Configura `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` y `STRIPE_WEBHOOK_SECRET` (variables de entorno o constantes en `core/config.php`).
- Configura el webhook en el Dashboard de Stripe apuntando a `https://tu-dominio.com/api/public/webhooks/stripe.php` (evento `checkout.session.completed`).

Documentación completa: **prompt/STRIPE_SETUP.md**

## Acceso al modo admin

- **Local (desarrollo):**
  - Login: `http://localhost:5173/admin/login`
  - Dashboard: `http://localhost:5173/admin`
- **Producción (dominio):**
  - Login: `https://godart-papelería.com/admin/login`
  - Dashboard: `https://godart-papelería.com/admin`

> Si el dominio final cambia, sustituir `godart-papeleria.com` por el dominio activo del proyecto.

## Subida de imágenes (nuevo)

- El endpoint `admin/products/image_upload.php` guarda archivos en `public_html/api/uploads/products/`.
- Asegúrate de que esa ruta tenga permisos de escritura en Hostinger.
- Formatos permitidos: JPG, PNG, WEBP, GIF (máximo 5MB).

## Importante sobre seguridad de sesión

- El login ahora crea sesión real en `admin_sessions`.
- Los endpoints admin protegidos requieren `Authorization: Bearer <token>`.
- El logout (`admin/auth/logout.php`) revoca la sesión actual.

## Credenciales por defecto (después de ejecutar setup.sql)

- Email: `admin@godart.com`
- Contraseña: `G0d4rt26`
