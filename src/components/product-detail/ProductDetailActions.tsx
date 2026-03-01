/** Cantidad, botón agregar al carrito y stock (rangos menudeo/mayoreo). */
import type { Product } from "../../types/Product"
import { QuantitySelector } from "../ui/QuantitySelector"

export interface StockRanges {
    menudeoStock: number
    mayoreoMinQty: number
    mayoreoStock: number
    mayoreoMaxQty: number
    totalStock: number
    hasMayoreo: boolean
}

export interface ProductDetailActionsProps {
    product: Product
    quantity: number
    onQuantityChange: (v: number) => void
    onAddToCart: () => void
    /** Comprar ahora: redirige a la pasarela de pago con este producto y cantidad. */
    onBuyNow?: () => void
    /** Mientras se prepara la sesión de pago (Comprar ahora). */
    isBuyNowLoading?: boolean
    /** Rangos de stock: menudeo (1 a N) y mayoreo (N+1 a M). Si no se pasa, se usa product.stock. */
    stockRanges?: StockRanges | null
}

export function ProductDetailActions({
    product,
    quantity,
    onQuantityChange,
    onAddToCart,
    onBuyNow,
    isBuyNowLoading = false,
    stockRanges,
}: ProductDetailActionsProps) {
    const totalStock = stockRanges?.totalStock ?? product.stock
    const maxQuantity = Math.min(20, Math.max(1, totalStock))

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
                <button
                    type="button"
                    className="product-detail__btn-buy"
                    onClick={onBuyNow}
                    disabled={isBuyNowLoading}
                >
                    <i className="fas fa-bolt" aria-hidden />
                    {isBuyNowLoading ? "Preparando pago…" : "Comprar ahora"}
                </button>
            </div>
        </div>
    )
}
