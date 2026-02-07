import type { CartItem as CartItemType } from "../../utils/cart"
import { QuantitySelector } from "../ui/QuantitySelector"

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

    return (
        <div
            className="cart-item"
            data-id={item.id}
            style={
                isRemoving
                    ? {
                          opacity: "0",
                          transform: "translateX(100%)",
                          transition: "all 0.3s ease",
                      }
                    : {}
            }
        >
            <div className="item-image" />
            <div className="item-info">
                <h4>{item.name}</h4>
                <p className="item-price">${item.price}</p>
            </div>
            <div className="item-quantity-controls">
                <QuantitySelector
                    id={`cart-quantity-${item.id}`}
                    value={item.quantity}
                    onChange={(v) => onQuantityChange(item.id, v)}
                    max={99}
                    visibleRows={6}
                />
            </div>
            <div className="item-subtotal">
                ${subtotal.toFixed(2)}
            </div>
            <button
                className="btn-remove"
                onClick={() => onRemove(item.id)}
                title="Eliminar del carrito"
            >
                <i className="fas fa-trash" />
            </button>
        </div>
    )
}
