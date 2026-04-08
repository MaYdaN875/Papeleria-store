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
    const maxQuantity = Math.min(500, Math.max(1, totalStock))

    const isDigitalCat = (c?: string | null) => typeof c === 'string' && /digital|impresi|copia|servicio/i.test(c);
    const isDigitalService = isDigitalCat(product.category) || isDigitalCat(product.parentCategory);

    const handleWhatsAppClick = () => {
        const text = encodeURIComponent(`¡Hola! 👋 Me interesa el servicio de: *${product.name}*. ¿Me podrían confirmar si cuentan con entrega a domicilio en mi zona? (Entiendo que aplica zona delimitada).`);
        window.open(`https://wa.me/3318686645?text=${text}`, '_blank');
    };

    if (isDigitalService) {
        return (
            <div className="product-detail__actions">
                <div className="product-detail__buttons" style={{ marginTop: '1.5rem' }}>
                    <button
                        type="button"
                        className="product-detail__btn-whatsapp"
                        onClick={handleWhatsAppClick}
                    >
                        <i className="fab fa-whatsapp" aria-hidden />
                        Solicitar servicio
                    </button>
                </div>
            </div>
        )
    }

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
