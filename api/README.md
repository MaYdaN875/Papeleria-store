# Archivos PHP para el Panel Admin

Estos archivos van en tu servidor Hostinger, dentro de `public_html/api/`

## Archivos incluidos

- `_admin_common.php` - Helpers compartidos (CORS, DB, auth por token)
- `admin_login.php` - Endpoint para login de administrador
- `admin_logout.php` - Endpoint para cerrar sesión admin (revoca token)
- `admin_products_list.php` - Endpoint para listar productos desde la BD
- `admin_categories_list.php` - Endpoint para listar categorías en formularios admin
- `admin_product_create.php` - Endpoint para crear productos
- `admin_product_update.php` - Endpoint para editar productos
- `admin_product_delete.php` - Endpoint para eliminación física de productos
- `admin_offers_list.php` - Lista productos con oferta activa
- `admin_offer_upsert.php` - Crea o actualiza oferta por producto
- `admin_offer_remove.php` - Quita oferta sin borrar producto
- `admin_sales_today.php` - Resumen de ingresos/ventas del día
- `admin_product_image_upload.php` - Sube imágenes de productos (archivo)
- `products_list_public.php` - Catálogo público para la tienda (sin sesión admin)
- `setup.sql` - SQL para crear tablas `admin_users`, `admin_sessions` y `product_offers`
- `generar_hash.php` - Script temporal para generar hash de contraseñas (borrar después de usar)

## Pasos rápidos

1. **Sube estos archivos** a `public_html/api/` en Hostinger
2. **Edita** `_admin_common.php`:
   - Cambia `TU_USUARIO_DB` por tu usuario de base de datos
   - Cambia `TU_PASSWORD_DB` por tu contraseña de base de datos
   - (Los encuentras en: Panel Hostinger → Bases de datos → Detalles)
3. **Ejecuta** `setup.sql` en phpMyAdmin para crear/actualizar tablas de admin, sesiones y ofertas
4. **Configura** `.env` en tu proyecto React con `VITE_API_URL=https://tu-dominio.com/api`

## Acceso al modo admin

- **Local (desarrollo):**
  - Login: `http://localhost:5173/admin/login`
  - Dashboard: `http://localhost:5173/admin`
- **Producción (dominio):**
  - Login: `https://godart-papeleria.com/admin/login`
  - Dashboard: `https://godart-papeleria.com/admin`

> Si el dominio final cambia, sustituir `godart-papeleria.com` por el dominio activo del proyecto.

## Subida de imágenes (nuevo)

- El endpoint `admin_product_image_upload.php` guarda archivos en `public_html/api/uploads/products/`.
- Asegúrate de que esa ruta tenga permisos de escritura en Hostinger.
- Formatos permitidos: JPG, PNG, WEBP, GIF (máximo 5MB).

## Importante sobre seguridad de sesión

- El login ahora crea sesión real en `admin_sessions`.
- Los endpoints admin protegidos requieren `Authorization: Bearer <token>`.
- El logout (`admin_logout.php`) revoca la sesión actual.

## Credenciales por defecto (después de ejecutar setup.sql)

- Email: `admin@godart.com`
- Contraseña: `G0d4rt26`
