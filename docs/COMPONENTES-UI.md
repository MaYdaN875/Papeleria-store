# Carpeta `components/ui` — ¿Por qué existe?

## Diferencia: `ui/` vs otros componentes

| Tipo | Ubicación | Característica |
|------|-----------|----------------|
| **UI (primitivos)** | `components/ui/` | Componentes genéricos, reutilizables en cualquier contexto. No conocen dominio (productos, carrito, etc.). |
| **Específicos** | `components/cart/`, `components/product/` | Componentes que saben de un dominio concreto. Usan tipos del negocio. |

## Ejemplos

- **QuantitySelector** → `ui/`: solo muestra números 1…N y notifica el valor elegido. Sirve en ProductDetail, Cart, formularios, etc.
- **Notification** → `ui/`: muestra un mensaje temporal. No sabe si es "agregado al carrito" o "sesión expirada".
- **ProductCard** → `product/`: conoce el modelo `Product`, precios, badges, etc.

## Regla práctica

> Si un componente puede usarse fuera de tu app (en otra tienda, dashboard, etc.) sin cambios, es un candidato para `ui/`.

---

## Estructura actual de `components/`

```
components/
├── ui/              # Primitivos reutilizables
│   ├── Notification.tsx
│   ├── QuantitySelector.tsx
│   └── index.ts
├── layout/          # Navbar, Footer, etc.
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── PageHeader.tsx
│   ├── SearchBar.tsx
│   ├── FloatingWhatsAppButton.tsx
│   └── index.ts
├── cart/            # Carrito
│   ├── CartEmpty.tsx
│   ├── CartItem.tsx
│   └── index.ts
├── product/         # Productos (card, carrusel)
│   ├── ProductCard.tsx
│   ├── ProductCarousel.tsx
│   ├── ProductCarouselSlide.tsx
│   └── index.ts
├── product-detail/  # Detalle de producto
│   ├── ProductDetailImage.tsx
│   ├── ProductDetailInfo.tsx
│   ├── ProductDetailActions.tsx
│   ├── ProductDetailShipping.tsx
│   └── index.ts
├── filters/         # Filtros
│   ├── FilterPanel.tsx
│   ├── CategoryDropdown.tsx
│   ├── CategoryFilters.tsx
│   └── index.ts
└── carousel/        # Carrusel banner
    ├── Carusel.tsx
    └── index.ts
```
