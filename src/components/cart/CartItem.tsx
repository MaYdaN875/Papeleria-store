import { useNavigate } from "react-router"
import { getProductById } from "../../data/products"
import type { CartItem as CartItemType } from "../../utils/cart"
import { QuantitySteppers } from "../ui/QuantitySteppers"

interface CartItemProps {
    item: CartItemType
    isRemoving: boolean
    onQuantityChange: (id: number, value: number) => void
    onRemove: (id: number) => void
}

/**
 * Fila de un producto en el carrito: imagen, info, selector de cantidad,
 * subtotal y botón eliminar.
 */
export function CartItem({
    item,
    isRemoving,
    onQuantityChange,
    onRemove,
}: CartItemProps) {
    const subtotal = Number.parseFloat(item.price) * item.quantity
    const navigate = useNavigate()
    const linkedProduct = item.productId ? getProductById(item.productId) : undefined
    const imageSrc = item.image ?? linkedProduct?.image ?? undefined

    return (
        <div
            className="cart-item"
            data-id={item.id}
            onClick={() => {
                if (item.productId) {
                    // Navegar a la ficha del producto y recordar volver al carrito
                    navigate(`/product/${item.productId}?returnTo=/cart`)
                }
            }}
            role={item.productId ? "button" : undefined}
            tabIndex={item.productId ? 0 : undefined}
            onKeyDown={(event) => {
                if (!item.productId) return
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    navigate(`/product/${item.productId}?returnTo=/cart`)
                }
            }}
            style={
                isRemoving
                    ? {
                          opacity: "0",
                          transform: "translateX(100%)",
                          transition: "all 0.3s ease",
                      }
                    : { cursor: item.productId ? "pointer" : "default" }
            }
        >
            <div className="item-image">
                {imageSrc ? (
                    // eslint-disable-next-line jsx-a11y/img-redundant-alt
                    <img src={imageSrc} alt={linkedProduct?.name ?? "Imagen del producto"} />
                ) : null}
            </div>
            <div className="item-info">
                <h4>{item.name}</h4>
                <p className="item-price">${item.price}</p>
            </div>
            <div className="item-quantity-controls" onClick={(e) => e.stopPropagation()}>
                <QuantitySteppers
                    id={`cart-quantity-${item.id}`}
                    value={item.quantity}
                    onChange={(v) => onQuantityChange(item.id, v)}
                    max={99}
                    min={1}
                />
            </div>
            <div className="item-subtotal">
                ${subtotal.toFixed(2)}
            </div>
            <button
                className="btn-remove"
                onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
                title="Eliminar del carrito"
            >
                <i className="fas fa-trash" />
            </button>
        </div>
    )
}
