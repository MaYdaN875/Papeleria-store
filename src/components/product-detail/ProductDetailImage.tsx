/** Imagen del producto en la página de detalle (ruta o emoji placeholder). */
import type { Product } from "../../types/Product"

export interface ProductDetailImageProps {
    product: Product
}

function isImageSource(value: string): boolean {
    return value.startsWith("/") || /^https?:\/\//i.test(value)
}

export function ProductDetailImage({ product }: Readonly<ProductDetailImageProps>) {
    return (
        <div className="product-detail__image">
            {isImageSource(product.image) ? (
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
