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

## Acceso al modo admin

- **Local (desarrollo):**
  - Login: `http://localhost:5173/admin/login`
  - Dashboard: `http://localhost:5173/admin`
- **Producción (dominio):**
  - Login: `https://godart-papeleria.com/admin/login`
  - Dashboard: `https://godart-papeleria.com/admin`

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
