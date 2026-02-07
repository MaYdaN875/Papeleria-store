import { Link, useNavigate } from "react-router"
import { CartEmpty, CartItem } from "../components/cart"
import { useCart } from "../hooks/useCart"
import { showNotification } from "../utils/notification"

/**
 * COMPONENTE: Cart
 * Página del carrito de compras
 */
export const Cart = () => {
    const navigate = useNavigate()
    const {
        cartItems,
        total,
        itemCount,
        removingId,
        removeItem,
        setQuantity,
        clearCart,
    } = useCart()

    const handleCheckout = () => {
        showNotification(
            "¡Procesando tu compra! Pronto serás redirigido al pago"
        )
        setTimeout(() => navigate("/"), 2000)
    }

    const handleClearCart = () => {
        if (
            window.confirm(
                "¿Estás seguro de que deseas eliminar todos los productos del carrito?"
            )
        ) {
            clearCart()
            showNotification("Carrito vaciado")
        }
    }

    return (
        <main className="cart-main">
            {cartItems.length === 0 ? (
                <CartEmpty />
            ) : (
                <div className="cart-full-container">
                    <h2 id="cartTitle">
                        Mi Carrito ({itemCount} Artículos)
                    </h2>

                    <div className="cart-items">
                        {cartItems.map((item) => (
                            <CartItem
                                key={item.id}
                                item={item}
                                isRemoving={removingId === item.id}
                                onQuantityChange={setQuantity}
                                onRemove={removeItem}
                            />
                        ))}
                    </div>

                    <div className="cart-total">
                        <h3>Total</h3>
                        <p id="totalAmount">{total.toFixed(2)}$</p>
                    </div>

                    <div className="cart-actions">
                        <button
                            className="btn-clear-cart"
                            onClick={handleClearCart}
                            title="Eliminar todos los productos"
                        >
                            <i className="fas fa-trash-alt" /> Eliminar todo
                        </button>
                        <Link to="/" className="btn-continue">
                            Continuar comprando
                        </Link>
                        <button
                            className="btn-checkout"
                            onClick={handleCheckout}
                        >
                            Proceder al pago
                        </button>
                    </div>
                </div>
            )}
        </main>
    )
}
