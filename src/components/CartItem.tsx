import type { CartItem as CartItemType } from "../utils/cart"

interface CartItemProps {
    item: CartItemType
    isRemoving: boolean
    onUpdateQuantity: (id: number, delta: number) => void
    onRemove: (id: number) => void
}

/**
 * Fila de un producto en el carrito: imagen, info, controles de cantidad,
 * subtotal y botón eliminar.
 */
export function CartItem({
    item,
    isRemoving,
    onUpdateQuantity,
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
                <button
                    className="btn-quantity-minus"
                    onClick={() => onUpdateQuantity(item.id, -1)}
                    title="Disminuir cantidad"
                >
                    <i className="fas fa-minus" />
                </button>
                <span className="quantity-display">{item.quantity}</span>
                <button
                    className="btn-quantity-plus"
                    onClick={() => onUpdateQuantity(item.id, 1)}
                    title="Aumentar cantidad"
                >
                    <i className="fas fa-plus" />
                </button>
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
