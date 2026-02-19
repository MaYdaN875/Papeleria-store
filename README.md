# Papeleria Store

Aplicación web de tienda en línea para papelería con:

- catálogo público de productos,
- panel administrativo con autenticación,
- CRUD de productos,
- módulo de ofertas,
- módulo de ingresos del día,
- asignación de carruseles home (1, 2, 3),
- administración de slides principales con imagen completa.

---

## Stack

- React + TypeScript + Vite
- React Router
- CSS
- PHP (API)
- MySQL (Hostinger / phpMyAdmin)

---

## Funcionalidades actuales

### Tienda pública
- listado y detalle de productos desde API real (`api/public/products.php`)
- badges de descuento y precio original cuando existe oferta activa
- slides de home desde API (`api/public/slides.php`) con fallback visual
- carruseles de productos con prioridad por slot de home (1/2/3)

### Panel admin
- login/logout con sesión persistida en backend
- CRUD de productos (crear, editar, eliminar)
- carga de imagen por URL o por archivo
- activación y retiro de ofertas sin borrar producto
- resumen de ingresos del día y detalle por producto
- configuración de slides del banner principal

---

## Estructura general

### Frontend

`src/`
- `pages/` vistas (incluye admin)
- `components/` UI y layout
- `services/` clientes API
- `services/api/base.ts` utilidades comunes de API
- `types/` tipos compartidos (`admin`, `store`, `product`)
- `utils/` utilidades (ej. validación de imágenes)
- `styles/` estilos

### Backend

`api/`
- `core/` helpers por responsabilidad (`config`, `db`, `auth`, `cors`, `catalog`, `response`)
- `admin/` endpoints protegidos por token
- `public/` endpoints públicos para tienda
- `_admin_common.php` cargador central de helpers (compatibilidad)
- `setup.sql` script de tablas base/actualizaciones

---

## Ejecución local

1) Clonar repositorio

```bash
git clone https://github.com/MaYdaN875/Papeleria-store.git
cd Papeleria-store
```

2) Instalar dependencias

```bash
npm install
```

3) Configurar variables de entorno

Crear `.env`:

```bash
VITE_API_URL=http://localhost/api
```

4) Ejecutar en desarrollo

```bash
npm run dev
```

5) Build de producción

```bash
npm run build
npm run preview
```

---

## Deploy (resumen)

- Subir frontend build (`dist/`) a `public_html/`
- Subir carpeta `api/` completa a `public_html/api/`
- Editar credenciales DB en `api/core/config.php`
- Ejecutar `api/setup.sql` en phpMyAdmin
- Verificar endpoints:
  - `/api/public/products.php`
  - `/api/public/slides.php`

---

## Documentación adicional

- Arquitectura admin: `docs/ADMIN-ARQUITECTURA.md`
- Guía API (Hostinger): `api/README.md`
