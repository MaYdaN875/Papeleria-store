# Análisis: API actual y lo que falta para Stripe

Resumen de lo implementado en la carpeta `api/` y los pasos necesarios para añadir una pasarela de pagos con Stripe (phpMyAdmin + PHP).

---

## 1. Lo que ya está hecho en la API

### Backend (PHP)

| Área | Estado | Detalle |
|------|--------|---------|
| **Admin auth** | ✅ Hecho | `admin/auth/login.php`, `logout.php`; sesiones en `admin_sessions`; Bearer token |
| **Admin productos** | ✅ Hecho | CRUD: list, create, update, delete, image_upload |
| **Admin categorías** | ✅ Hecho | list |
| **Admin ofertas** | ✅ Hecho | list, upsert, remove |
| **Admin slides** | ✅ Hecho | list, create, delete |
| **Admin ventas del día** | ✅ Hecho | `sales/today.php` (usa `orders` + `order_items` si existen) |
| **Público** | ✅ Hecho | `public/products.php`, `public/slides.php` (catálogo y banners sin auth) |
| **Core** | ✅ Hecho | config, db, cors, response, auth (solo admin), catalog |

### Base de datos (setup.sql actual)

- `admin_users` – administradores
- `admin_sessions` – sesiones admin (token hash, expiración)
- `product_offers` – ofertas por producto
- `home_carousel_assignments` – productos en carruseles
- `home_slides` – slides del banner

**Nota:** `setup.sql` no crea `products` ni `categories`; se asume que ya existen en phpMyAdmin. Tampoco crea tablas de **usuarios de tienda**, **carrito** ni **pedidos**.

### Frontend

- **Carrito:** solo `localStorage` (`utils/cart.ts`, `hooks/useCart.ts`). No hay API de carrito.
- **Login/SignUp (cliente):** páginas presentes pero sin backend; el submit hace `console.log` y no llama a ninguna API.

---

## 2. Esquema de BD según docs (schema.dbml y SCHEMA-MAPEO)

En `docs/schema.dbml` y `docs/SCHEMA-MAPEO.md` está definido:

- **roles** – admin, user  
- **users** – clientes (role_id, name, email, password, is_active)  
- **cart_items** – user_id, product_id, quantity (carrito persistido por usuario)  
- **orders** – user_id, total, status (pending | paid | shipped | cancelled)  
- **order_items** – order_id, product_id, quantity, price (precio en el momento de la compra)

Para Stripe conviene añadir en `orders` algo como:

- `payment_intent_id` o `stripe_checkout_session_id` (según si usas Payment Intents o Checkout)
- `status`: incluir `'pending_payment'` antes de confirmar pago y `'paid'` cuando Stripe confirme.

---

## 3. Qué falta para tener pasarela de pagos con Stripe

### 3.1 Login de usuario (cliente)

- **BD:** Crear tablas `roles` y `users` (según schema.dbml) si no existen en phpMyAdmin.
- **API:**
  - `POST api/public/auth/register.php` (o `signup.php`) – registrar usuario (email, password, name).
  - `POST api/public/auth/login.php` – login cliente; devolver token/sesión (JWT o sesión en BD similar a admin).
- **Frontend:** Conectar Login y SignUp a estos endpoints; guardar token y usarlo en las peticiones (carrito, checkout).

### 3.2 Carrito en backend

- **BD:** Crear tabla `cart_items` (user_id, product_id, quantity, unique(user_id, product_id)).
- **API:**
  - `GET api/public/cart.php` – listar carrito del usuario (requiere auth).
  - `POST api/public/cart.php` – añadir o actualizar ítem (product_id, quantity).
  - `DELETE api/public/cart.php` – quitar ítem o vaciar carrito.
- **Frontend:** Si hay usuario logueado, usar esta API en lugar de (o además de) `localStorage`; al hacer login, opción de fusionar carrito de `localStorage` con el del servidor.

### 3.3 Preparación de la venta (pedido)

- **BD:** Tablas `orders` y `order_items` (y en `orders` campos para Stripe: ver abajo).
- **Flujo:**
  1. Usuario en `/cart` con ítems (carrito API o localStorage).
  2. Botón “Pagar” → backend crea el **pedido** en estado `pending` o `pending_payment` y sus `order_items` (precio actual por línea).
  3. Backend crea en Stripe un **PaymentIntent** (o **Checkout Session**) por el total del pedido y devuelve `client_secret` (o URL de Checkout) al frontend.
  4. Frontend: o bien usa Stripe.js / Elements para cobrar con el `client_secret`, o redirige a Stripe Checkout.
  5. Tras el pago, Stripe envía un **webhook** (p. ej. `payment_intent.succeeded`); el backend actualiza el pedido a `paid` y, si quieres, descuenta stock.
  6. Opcional: si el carrito está en BD, vaciarlo al confirmar el pedido.

### 3.4 Stripe en backend (PHP)

- **Config:** Añadir en `core/config.php` (o `.env` si lo usas): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
- **Endpoints sugeridos:**
  - `POST api/public/orders/create.php` – crea `orders` + `order_items`, crea PaymentIntent (o Checkout Session), guarda `stripe_payment_intent_id` (o `stripe_session_id`) en el pedido; devuelve `client_secret` (o URL) al frontend.
  - `POST api/public/stripe/webhook.php` – recibe eventos de Stripe; si es `payment_intent.succeeded`, busca el pedido por `payment_intent_id` y pone `status = 'paid'`; opcional: actualizar stock.
- **Seguridad:** Verificar firma del webhook con `STRIPE_WEBHOOK_SECRET`; en `orders/create.php` validar que el usuario esté autenticado y que el carrito/total coincida con lo que se cobra.

### 3.5 Cambios en la BD para Stripe (phpMyAdmin)

Ejemplo de columnas útiles en `orders`:

- `stripe_payment_intent_id` VARCHAR(255) NULL  
- o `stripe_checkout_session_id` VARCHAR(255) NULL  
- `status`: asegurar valores como `pending`, `pending_payment`, `paid`, `shipped`, `cancelled`.

Crear tablas que falten según `docs/schema.dbml`: `roles`, `users`, `cart_items`, `orders`, `order_items` (y ajustar nombres de columnas si tu esquema actual difiere).

---

## 4. Checklist resumido

| # | Tarea | Prioridad |
|---|--------|------------|
| 1 | Crear en phpMyAdmin: `roles`, `users` (y opcionalmente `user_sessions` para tokens cliente) | Alta |
| 2 | API: registro y login de cliente (public/auth) | Alta |
| 3 | Crear tabla `cart_items` y endpoints GET/POST/DELETE del carrito (public/cart) | Alta |
| 4 | Crear tablas `orders` y `order_items` (con campo Stripe en `orders`) | Alta |
| 5 | Endpoint “crear pedido” + crear PaymentIntent o Checkout Session en Stripe | Alta |
| 6 | Webhook Stripe para marcar pedido como pagado (y opcional stock) | Alta |
| 7 | Frontend: conectar Login/SignUp a la API; usar carrito API si hay sesión; pantalla checkout con Stripe.js o redirección a Checkout | Alta |
| 8 | Sincronizar carrito localStorage ↔ carrito API al hacer login | Media |
| 9 | Panel admin: listar pedidos (ya hay `sales/today.php`, ampliar si hace falta) | Media |

Con esto tendrás: **login de usuario** → **carrito persistido** → **creación de pedido** → **pago con Stripe** → **confirmación vía webhook** y base lista para seguir creciendo (envíos, estados, etc.).
