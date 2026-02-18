/**
 * Una slide del carrusel de productos: imagen, badge, precio, botón agregar. Click navega al detalle.
 */
import type { Product } from "../../types/Product"

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

function isImageSource(value: string): boolean {
    return value.startsWith("/") || /^https?:\/\//i.test(value)
}

export function ProductCarouselSlide({
    product,
    config,
    onNavigate,
    onAddToCart,
}: Readonly<ProductCarouselSlideProps>) {
    const { badge, originalPrice, brand } = config ?? {}

    return (
        <div
            className="product-card-carousel"
            onClick={() => onNavigate(product.id)}
            onKeyDown={(e) =>
                e.key === "Enter" && onNavigate(product.id)
            }
            role="button"
            tabIndex={0}
        >
            <div className="product-image-carousel">
                {isImageSource(product.image) ? (
                    <img src={product.image} alt={product.name} />
                ) : (
                    <div className="product-placeholder-carousel">
                        {product.image || "📦"}
                    </div>
                )}
                {badge && (
                    <div className={`product-badge ${badge.type}`}>
                        {badge.value}
                    </div>
                )}
            </div>
            <div className="product-info-carousel">
                <h4>{product.name}</h4>
                {brand && (
                    <p className="product-brand">Marca: {brand}</p>
                )}
                <div className="product-rating" aria-hidden>
                    <i className="fas fa-star" aria-hidden />
                    <i className="fas fa-star" aria-hidden />
                    <i className="fas fa-star" aria-hidden />
                    <i className="fas fa-star" aria-hidden />
                    <i className="fas fa-star-half-alt" aria-hidden />
                </div>
                <div className="product-price">
                    {originalPrice != null &&
                        originalPrice > product.price && (
                            <span className="price-original">
                                ${originalPrice.toFixed(2)}
                            </span>
                        )}
                    <span className="price-current">
                        ${product.price.toFixed(2)}
                    </span>
                </div>
                <button
                    type="button"
                    className="btn-add-cart"
                    onClick={(e) => {
                        e.stopPropagation()
                        onAddToCart(
                            product.name,
                            product.price.toFixed(2)
                        )
                    }}
                >
                    <i
                        className="fas fa-shopping-cart"
                        aria-hidden
                    />{" "}
                    Agregar al carrito
                </button>
            </div>
        </div>
    )
}
