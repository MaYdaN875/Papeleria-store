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
- `setup.sql` - SQL para crear tabla `admin_users` y usuario de prueba
- `generar_hash.php` - Script temporal para generar hash de contraseñas (borrar después de usar)

## Pasos rápidos

1. **Sube estos archivos** a `public_html/api/` en Hostinger
2. **Edita** `_admin_common.php`:
   - Cambia `TU_USUARIO_DB` por tu usuario de base de datos
   - Cambia `TU_PASSWORD_DB` por tu contraseña de base de datos
   - (Los encuentras en: Panel Hostinger → Bases de datos → Detalles)
3. **Ejecuta** `setup.sql` en phpMyAdmin para crear/actualizar tabla de admin y sesiones
4. **Configura** `.env` en tu proyecto React con `VITE_API_URL=https://tu-dominio.com/api`

## Importante sobre seguridad de sesión

- El login ahora crea sesión real en `admin_sessions`.
- Los endpoints admin protegidos requieren `Authorization: Bearer <token>`.
- El logout (`admin_logout.php`) revoca la sesión actual.

## Credenciales por defecto (después de ejecutar setup.sql)

- Email: `admin@godart.com`
- Contraseña: `password`

**⚠️ IMPORTANTE:** Cambia la contraseña en producción usando `generar_hash.php` y actualizando el INSERT en la BD.
