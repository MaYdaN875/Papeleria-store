/** Cantidad, botón agregar al carrito y stock. */
import type { Product } from "../../types/Product"
import { QuantitySelector } from "../ui/QuantitySelector"

export interface ProductDetailActionsProps {
    product: Product
    quantity: number
    onQuantityChange: (v: number) => void
    onAddToCart: () => void
}

export function ProductDetailActions({
    product,
    quantity,
    onQuantityChange,
    onAddToCart,
}: ProductDetailActionsProps) {
    const maxQuantity = Math.min(20, product.stock)

    return (
        <div className="product-detail__actions">
            <div className="product-detail__quantity-row">
                <label
                    htmlFor="quantity-select-button"
                    className="product-detail__quantity-label"
                >
                    Cantidad disponible:
                </label>
                <div className="product-detail__quantity-wrapper">
                    <QuantitySelector
                        id="quantity-select-button"
                        value={quantity}
                        onChange={onQuantityChange}
                        max={maxQuantity}
                        visibleRows={5}
                    />
                </div>
            </div>
            <div className="product-detail__buttons">
                <button
                    type="button"
                    className="btn-add-cart product-detail__btn-add"
                    onClick={onAddToCart}
                >
                    <i className="fas fa-shopping-cart" aria-hidden />
                    Agregar
                </button>
                <button type="button" className="product-detail__btn-buy">
                    <i className="fas fa-bolt" aria-hidden />
                    Comprar ahora
                </button>
            </div>
        </div>
    )
}
