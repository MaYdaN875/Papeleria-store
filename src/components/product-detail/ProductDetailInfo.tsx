import type { Product } from "../../types/Product"

export interface ProductDetailInfoProps {
    product: Product
    brand?: string
    originalPrice?: number
    rating?: number
    reviews?: number
}

function StarRating({
    rating,
    reviews,
}: {
    rating: number
    reviews: number
}) {
    return (
        <div className="product-detail__rating">
            {Array.from({ length: 5 }).map((_, i) => {
                const isFilled = i < Math.floor(rating)
                const isHalf =
                    i === Math.floor(rating) && rating % 1 >= 0.5
                const starClass = isFilled
                    ? "fas fa-star"
                    : isHalf
                      ? "fas fa-star-half-alt"
                      : "far fa-star"
                return (
                    <i
                        key={`star-${i}`}
                        className={starClass}
                        aria-hidden
                    />
                )
            })}
            <span className="product-detail__reviews">
                ({reviews} reseñas)
            </span>
        </div>
    )
}

export function ProductDetailInfo({
    product,
    brand,
    originalPrice,
    rating = 4.5,
    reviews = 0,
}: ProductDetailInfoProps) {
    return (
        <div className="product-detail__info">
            {brand && (
                <p className="product-detail__brand">
                    Marca: <strong>{brand}</strong>
                </p>
            )}
            <h1 className="product-detail__title">{product.name}</h1>
            <StarRating rating={rating} reviews={reviews} />
            <p className="product-detail__description">{product.description}</p>
            <div className="product-detail__price">
                {originalPrice != null && originalPrice > product.price && (
                    <span className="product-detail__price-original">
                        ${originalPrice.toFixed(2)}
                    </span>
                )}
                <span className="product-detail__price-current">
                    ${product.price.toFixed(2)}
                </span>
            </div>
        </div>
    )
}
