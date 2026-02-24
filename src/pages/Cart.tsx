import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { CartEmpty, CartItem } from "../components/cart"
import { useCart } from "../hooks/useCart"
import { createCheckoutSession } from "../services/customerApi"
import "../styles/password-recovery.css"
import { showNotification } from "../utils/notification"
import {
    getStoreUserToken,
    isStoreUserLoggedIn,
} from "../utils/storeSession"

/**
 * Página del carrito de compras.
 * "Proceder al pago" requiere sesión con la API, crea sesión Stripe y redirige a pagar.
 */
export const Cart = () => {
    const navigate = useNavigate()
    const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)
    const [checkoutError, setCheckoutError] = useState("")
    const {
        cartItems,
        total,
        itemCount,
        removingId,
        removeItem,
        setQuantity,
        clearCart,
    } = useCart()

    const handleCheckout = async () => {
        setCheckoutError("")

        if (!isStoreUserLoggedIn()) {
            navigate("/login?returnTo=/cart", { replace: true })
            return
        }

        const itemsWithId = cartItems.filter((item) => item.productId != null && item.productId > 0)
        const missingId = cartItems.some((item) => !item.productId || item.productId <= 0)
        if (missingId && itemsWithId.length === 0) {
            setCheckoutError(
                "Ningún producto tiene ID válido. Quita los productos y agrégalos de nuevo desde la ficha del producto."
            )
            return
        }
        if (missingId) {
            setCheckoutError(
                "Algunos productos no se pueden cobrar. Quítalos y agrégalos de nuevo desde la ficha del producto."
            )
            return
        }

        const token = getStoreUserToken()
        if (!token) {
            navigate("/login?returnTo=/cart", { replace: true })
            return
        }

        setIsCheckoutLoading(true)
        const origin = window.location.origin
        const result = await createCheckoutSession(token, {
            items: itemsWithId.map((item) => ({
                product_id: item.productId!,
                quantity: item.quantity,
            })),
            success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/checkout/cancel`,
        })

        setIsCheckoutLoading(false)
        if (!result.ok || !result.url) {
            setCheckoutError(result.message ?? "No se pudo iniciar el pago. Intenta de nuevo.")
            return
        }
        showNotification("Redirigiendo a la pasarela de pago…")
        window.location.href = result.url
    }

    const handleClearCart = () => {
        if (
            window.confirm(
                "¿Estás seguro de que deseas eliminar todos los productos del carrito?"
            )
        ) {
            clearCart()
            showNotification("Carrito vaciado")
            window.scrollTo(0, 0)
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
                        <p id="totalAmount">${total.toFixed(2)}</p>
                    </div>

                    {checkoutError && (
                        <p className="password-feedback password-feedback--error" style={{ marginBottom: 12 }}>
                            {checkoutError}
                        </p>
                    )}

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
                            onClick={() => void handleCheckout()}
                            disabled={isCheckoutLoading}
                        >
                            {isCheckoutLoading ? "Preparando pago…" : "Proceder al pago"}
                        </button>
                    </div>
                </div>
            )}
        </main>
    )
}
