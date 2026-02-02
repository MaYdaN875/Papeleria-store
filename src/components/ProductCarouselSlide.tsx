import type { Product } from "../types/Product"

export type ProductCarouselSlideConfig = {
    badge?: { type: "discount" | "sale"; value: string }
    originalPrice?: number
    brand?: string
}

export interface ProductCarouselSlideProps {
    product: Product
    config?: ProductCarouselSlideConfig
    onNavigate: (id: number) => void
    onAddToCart: (name: string, price: string) => void
}

/**
 * Tarjeta de producto para usar dentro del carrusel de productos (una por slide).
 */
export function ProductCarouselSlide({
    product,
    config,
    onNavigate,
    onAddToCart,
}: ProductCarouselSlideProps) {
    const { badge, originalPrice, brand } = config ?? {}

    return (
        <div
            className="product-card-carousel"
            onClick={() => onNavigate(product.id)}
            onKeyDown={(e) => e.key === "Enter" && onNavigate(product.id)}
            role="button"
            tabIndex={0}
        >
            <div className="product-image-carousel">
                {product.image.startsWith("/") ? (
                    <img src={product.image} alt={product.name} />
                ) : (
                    <div className="product-placeholder-carousel">{product.image || "📦"}</div>
                )}
                {badge && (
                    <div className={`product-badge ${badge.type}`}>{badge.value}</div>
                )}
            </div>
            <div className="product-info-carousel">
                <h4>{product.name}</h4>
                {brand && <p className="product-brand">Marca: {brand}</p>}
                <div className="product-rating" aria-hidden="true">
                    <i className="fas fa-star" aria-hidden="true" />
                    <i className="fas fa-star" aria-hidden="true" />
                    <i className="fas fa-star" aria-hidden="true" />
                    <i className="fas fa-star" aria-hidden="true" />
                    <i className="fas fa-star-half-alt" aria-hidden="true" />
                </div>
                <div className="product-price">
                    {originalPrice != null && originalPrice > product.price && (
                        <span className="price-original">${originalPrice.toFixed(2)}</span>
                    )}
                    <span className="price-current">${product.price.toFixed(2)}</span>
                </div>
                <button
                    type="button"
                    className="btn-add-cart"
                    onClick={(e) => {
                        e.stopPropagation()
                        onAddToCart(product.name, product.price.toFixed(2))
                    }}
                >
                    <i className="fas fa-shopping-cart" aria-hidden="true" /> Agregar al carrito
                </button>
            </div>
        </div>
    )
}
