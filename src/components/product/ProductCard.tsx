/**
 * Tarjeta de producto: imagen, nombre, marca, rating, precio y botón agregar al carrito.
 * Opcional badge (descuento/oferta) y precio tachado. Click en la tarjeta navega al detalle.
 */
import React from "react";
import { useNavigate } from "react-router";
import type { Product } from "../../types/Product";

export type ProductCardBadge = { type: "discount" | "sale"; value: string }

export interface ProductCardProps {
    product: Product
    badge?: ProductCardBadge
    originalPrice?: number
    brand?: string
    rating?: number
    onAddToCart: () => void
    onNavigate?: () => void
}

function isImageSource(value: string): boolean {
    return value.startsWith("/") || /^https?:\/\//i.test(value)
}

function StarRating({ rating }: Readonly<{ rating: number }>) {
    const full = Math.floor(rating)
    const hasHalf = rating % 1 >= 0.5
    return (
        <div
            className="product-rating"
            aria-label={`Valoración: ${rating} de 5`}
        >
            {Array.from({ length: full }, (_, i) => (
                <i key={i} className="fas fa-star" aria-hidden />
            ))}
            {hasHalf && <i className="fas fa-star-half-alt" aria-hidden />}
            {Array.from({ length: 5 - full - (hasHalf ? 1 : 0) }, (_, i) => (
                <i key={`e-${i}`} className="far fa-star" aria-hidden />
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
    onNavigate,
}: Readonly<ProductCardProps>) {
    const navigate = useNavigate()

    const handleClick = () => {
        if (onNavigate) {
            onNavigate()
        } else {
            navigate(`/product/${product.id}`)
        }
    }
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleClick()
    }

    const isDigitalService = typeof product.category === 'string' && product.category.toLowerCase().includes('digitales');

    const handleWhatsAppClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const text = encodeURIComponent(`Hola, quiero solicitar el siguiente servicio: ${product.name}. Mi nombre completo es: `);
        window.open(`https://wa.me/3318686645?text=${text}`, '_blank');
    };

    const content = (
        <>
            <div className="product-image">
                {isImageSource(product.image) ? (
                    <img src={product.image} alt={product.name} />
                ) : (
                    <div className="product-placeholder">
                        {product.image || "📦"}
                    </div>
                )}
                {badge && (
                    <div
                        className={`product-badge ${badge.type}`}
                    >
                        {badge.value}
                    </div>
                )}
            </div>
            <div className="product-info">
                <h4>{product.name}</h4>
                {brand && (
                    <p className="product-brand">Marca: {brand}</p>
                )}
                {rating > 0 && <StarRating rating={rating} />}
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
                {isDigitalService ? (
                    <button
                        type="button"
                        className="btn-add-cart btn-whatsapp"
                        onClick={handleWhatsAppClick}
                    >
                        <i className="fab fa-whatsapp" aria-hidden /> Solicitar servicio
                    </button>
                ) : (
                    <button
                        type="button"
                        className="btn-add-cart"
                        onClick={(e) => {
                            e.stopPropagation()
                            onAddToCart()
                        }}
                    >
                        <i className="fas fa-shopping-cart" aria-hidden /> Agregar
                        al carrito
                    </button>
                )}
            </div>
        </>
    )

    return (
        <div
            className="product-card"
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            style={{ cursor: "pointer" }}
        >
            {content}
        </div>
    )
}
