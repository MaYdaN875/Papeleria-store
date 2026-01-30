import { useNavigate } from "react-router"
import type { Product } from "../types/Product"

export type ProductCardBadge = { type: "discount" | "sale"; value: string }

export interface ProductCardProps {
    product: Product
    /** Badge opcional: descuento (-20%) o venta (HOT, NUEVO) */
    badge?: ProductCardBadge
    /** Precio original para mostrar tachado (opcional) */
    originalPrice?: number
    /** Marca para mostrar bajo el nombre (opcional) */
    brand?: string
    /** Rating 0-5 para estrellas (opcional) */
    rating?: number
    onAddToCart: () => void
}

function StarRating({ rating }: { rating: number }) {
    const full = Math.floor(rating)
    const hasHalf = rating % 1 >= 0.5
    return (
        <div className="product-rating" aria-label={`Valoración: ${rating} de 5`}>
            {Array.from({ length: full }, (_, i) => (
                <i key={i} className="fas fa-star" aria-hidden="true" />
            ))}
            {hasHalf && <i className="fas fa-star-half-alt" aria-hidden="true" />}
            {Array.from({ length: 5 - full - (hasHalf ? 1 : 0) }, (_, i) => (
                <i key={`e-${i}`} className="far fa-star" aria-hidden="true" />
            ))}
        </div>
    )
}

export function ProductCard({
    product,
    badge,
    originalPrice,
    brand,
    rating = 5,
    onAddToCart,
}: ProductCardProps) {
    const navigate = useNavigate()

    const handleClick = () => navigate(`/product/${product.id}`)
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleClick()
    }

    const content = (
        <>
            <div className="product-image">
                {product.image.startsWith("/") ? (
                    <img src={product.image} alt={product.name} />
                ) : (
                    <div className="product-placeholder">{product.image || "📦"}</div>
                )}
                {badge && (
                    <div className={`product-badge ${badge.type}`}>{badge.value}</div>
                )}
            </div>
            <div className="product-info">
                <h4>{product.name}</h4>
                {brand && <p className="product-brand">Marca: {brand}</p>}
                {rating > 0 && <StarRating rating={rating} />}
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
                        onAddToCart()
                    }}
                >
                    <i className="fas fa-shopping-cart" aria-hidden="true" /> Agregar al carrito
                </button>
            </div>
        </>
    )

    const cardProps = {
        className: "product-card",
        onClick: handleClick,
        onKeyDown: handleKeyDown,
        role: "button" as const,
        tabIndex: 0,
        style: { cursor: "pointer" as const },
    }

    return <div {...cardProps}>{content}</div>
}
