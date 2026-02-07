import type { Product } from "../../types/Product"

export interface ProductDetailImageProps {
    product: Product
}

export function ProductDetailImage({ product }: ProductDetailImageProps) {
    return (
        <div className="product-detail__image">
            {product.image.startsWith("/") ? (
                <img
                    src={product.image}
                    alt={product.name}
                    className="product-detail__image-img"
                />
            ) : (
                <span className="product-detail__image-placeholder">
                    {product.image || "📦"}
                </span>
            )}
        </div>
    )
}
