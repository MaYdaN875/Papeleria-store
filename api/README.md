# Archivos PHP para el Panel Admin

Estos archivos van en tu servidor Hostinger, dentro de `public_html/api/`

## Archivos incluidos

- `admin_login.php` - Endpoint para login de administrador
- `admin_products_list.php` - Endpoint para listar productos desde la BD
- `setup.sql` - SQL para crear tabla `admin_users` y usuario de prueba
- `generar_hash.php` - Script temporal para generar hash de contraseñas (borrar después de usar)

## Pasos rápidos

1. **Sube estos archivos** a `public_html/api/` en Hostinger
2. **Edita** `admin_login.php` y `admin_products_list.php`:
   - Cambia `TU_USUARIO_DB` por tu usuario de base de datos
   - Cambia `TU_PASSWORD_DB` por tu contraseña de base de datos
   - (Los encuentras en: Panel Hostinger → Bases de datos → Detalles)
3. **Ejecuta** `setup.sql` en phpMyAdmin para crear la tabla y usuario admin
4. **Configura** `.env` en tu proyecto React con `VITE_API_URL=https://tu-dominio.com/api`

## Credenciales por defecto (después de ejecutar setup.sql)

- Email: `admin@godart.com`
- Contraseña: `password`

**⚠️ IMPORTANTE:** Cambia la contraseña en producción usando `generar_hash.php` y actualizando el INSERT en la BD.
