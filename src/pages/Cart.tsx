import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { CartEmpty, CartItem } from "../components/cart"
import { useCart } from "../hooks/useCart"
import { createCheckoutSession, validateShippingLocation } from "../services/customerApi"
import "../styles/password-recovery.css"
import { showNotification } from "../utils/notification"
import {
    getStoreUser,
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
    const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery">("pickup")
    const [isValidatingLocation, setIsValidatingLocation] = useState(false)
    const [locationValidated, setLocationValidated] = useState(false)
    const [locationMessage, setLocationMessage] = useState("")
    
    // Formulario de envio
    const user = getStoreUser()
    const [useSavedAddress, setUseSavedAddress] = useState(!!user?.default_delivery_address)
    const [addressStreet, setAddressStreet] = useState("")
    const [addressColony, setAddressColony] = useState("")
    const [addressRef, setAddressRef] = useState("")
    const [addressPhone, setAddressPhone] = useState("")
    
    const {
        cartItems,
        total,
        itemCount,
        removingId,
        sessionExpired,
        removeItem,
        setQuantity,
        clearCart,
    } = useCart()

    const handleCheckout = async () => {
        setCheckoutError("")

        if (deliveryMethod === "delivery") {
            if (!locationValidated) {
                setCheckoutError("Debes validar tu ubicación para el envío a domicilio.")
                return
            }
            if (!useSavedAddress) {
                if (!addressStreet.trim() || !addressColony.trim() || !addressPhone.trim()) {
                    setCheckoutError("Por favor, llena los campos obligatorios de la dirección de envío.")
                    return
                }
            }
        }

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
        const fullDeliveryAddress = deliveryMethod === "delivery" 
            ? (useSavedAddress && user?.default_delivery_address 
                ? user.default_delivery_address 
                : `${addressStreet}, Col. ${addressColony}. Ref: ${addressRef}. Tel: ${addressPhone}`) 
            : undefined;

        const result = await createCheckoutSession(token, {
            items: itemsWithId.map((item) => ({
                product_id: item.productId!,
                quantity: item.quantity,
            })),
            success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/checkout/cancel`,
            delivery_method: deliveryMethod,
            delivery_address: fullDeliveryAddress
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

    const handleValidateLocation = () => {
        setIsValidatingLocation(true)
        setLocationMessage("")
        
        if (!navigator.geolocation) {
            setLocationMessage("Tu navegador no soporta geolocalización.")
            setIsValidatingLocation(false)
            return
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const result = await validateShippingLocation(position.coords.latitude, position.coords.longitude)
                setIsValidatingLocation(false)
                
                if (result.ok && result.allowed) {
                    setLocationValidated(true)
                    setLocationMessage("")
                    showNotification("Ubicación validada con éxito")
                } else {
                    setLocationValidated(false)
                    setLocationMessage(result.message || "Estás fuera de nuestra zona de envío.")
                }
            },
            (error) => {
                setIsValidatingLocation(false)
                setLocationValidated(false)
                let msg = "No se pudo obtener la ubicación."
                if (error.code === error.PERMISSION_DENIED) msg = "Permiso de ubicación denegado. Habilita el GPS."
                setLocationMessage(msg)
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        )
    }

    const finalTotal = deliveryMethod === "delivery" ? total + 10 : total;

    return (
        <main className="cart-main">
            {cartItems.length === 0 ? (
                <CartEmpty />
            ) : (
                <div className="cart-full-container">
                    <h2 id="cartTitle">
                        Mi Carrito ({itemCount} Artículos)
                    </h2>

                    {sessionExpired && (
                        <div className="cart-session-expired-banner">
                            <i className="fas fa-exclamation-triangle" />
                            <span>
                                Tu sesión expiró. Tus productos siguen aquí.
                                {" "}
                                <Link to="/login?returnTo=/cart">
                                    Inicia sesión de nuevo
                                </Link>
                                {" "} para sincronizar tu carrito.
                            </span>
                        </div>
                    )}

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

                    <div className="delivery-method-section" style={{marginBottom: "20px", display: "flex", flexDirection: "column", gap: "10px"}}>
                        <h3>Método de entrega</h3>
                        <label style={{display: "flex", alignItems: "center", gap: "8px", cursor: "pointer"}}>
                            <input
                                type="radio"
                                name="deliveryMethod"
                                value="pickup"
                                checked={deliveryMethod === "pickup"}
                                onChange={() => {
                                    setDeliveryMethod("pickup")
                                    setCheckoutError("")
                                }}
                            />
                            <span><i className="fas fa-store"></i> Recoger en tienda (Gratis)</span>
                        </label>
                        <label style={{display: "flex", alignItems: "center", gap: "8px", cursor: "pointer"}}>
                            <input
                                type="radio"
                                name="deliveryMethod"
                                value="delivery"
                                checked={deliveryMethod === "delivery"}
                                onChange={() => {
                                    setDeliveryMethod("delivery")
                                    setCheckoutError("")
                                }}
                            />
                            <span><i className="fas fa-motorcycle"></i> Envío a domicilio (+$10.00 MXN)</span>
                        </label>

                        {deliveryMethod === "delivery" && (
                            <div className="location-validation" style={{marginTop: "10px", padding: "15px", backgroundColor: "#f9f9f9", borderRadius: "8px", border: "1px solid #ddd"}}>
                                {!locationValidated ? (
                                    <>
                                        <p style={{marginBottom: "10px", fontSize: "0.9rem", color: "#666"}}>Para el envío a domicilio, necesitamos validar por GPS que te encuentras a máximo 1km de nuestra sucursal.</p>
                                        <button 
                                            type="button" 
                                            className="btn-checkout" 
                                            style={{backgroundColor: "#28a745", padding: "8px 15px", fontSize: "0.9rem", width: "auto"}}
                                            onClick={handleValidateLocation}
                                            disabled={isValidatingLocation}
                                        >
                                            {isValidatingLocation ? "Obteniendo ubicación..." : "Validar mi ubicación"}
                                        </button>
                                        {locationMessage && <p className="password-feedback password-feedback--error" style={{marginTop: "10px"}}>{locationMessage}</p>}
                                    </>
                                ) : (
                                    <div style={{display: "flex", flexDirection: "column", gap: "10px"}}>
                                        <div style={{color: "#28a745", display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold", marginBottom: "10px"}}>
                                            <i className="fas fa-check-circle"></i> ¡Estás en nuestra zona de envío! (+ $10.00 MXN)
                                        </div>
                                        <h4 style={{margin: "0 0 5px 0", fontSize: "1rem"}}>Datos de Entrega</h4>
                                        
                                        {useSavedAddress && user?.default_delivery_address ? (
                                            <div style={{backgroundColor: "#e8f5e9", color: "#2e7d32", padding: "12px", borderRadius: "8px", border: "1px solid #c8e6c9"}}>
                                                <p style={{margin: "0 0 8px 0", fontWeight: "bold"}}>Enviaremos tu pedido a la dirección guardada:</p>
                                                <p style={{margin: "0 0 10px 0", fontSize: "0.95rem"}}>{user.default_delivery_address}</p>
                                                <button 
                                                    type="button" 
                                                    onClick={() => setUseSavedAddress(false)}
                                                    style={{backgroundColor: "white", color: "#2e7d32", border: "1px solid #2e7d32", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "0.85rem"}}
                                                >
                                                    Usar u otra dirección
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                {user?.default_delivery_address && (
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setUseSavedAddress(true)}
                                                        style={{backgroundColor: "#2e7d32", color: "white", border: "none", padding: "8px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "0.9rem", alignSelf: "flex-start"}}
                                                    >
                                                        Utilizar mi dirección guardada
                                                    </button>
                                                )}
                                                <input 
                                                    type="text" 
                                                    placeholder="Calle y Número (Ej. Av. Hidalgo 123)*" 
                                                    value={addressStreet}
                                                    onChange={(e) => setAddressStreet(e.target.value)}
                                                    style={{padding: "8px", borderRadius: "4px", border: "1px solid #ccc", width: "100%", fontSize: "0.95rem"}}
                                                />
                                                <input 
                                                    type="text" 
                                                    placeholder="Colonia y Código Postal*" 
                                                    value={addressColony}
                                                    onChange={(e) => setAddressColony(e.target.value)}
                                                    style={{padding: "8px", borderRadius: "4px", border: "1px solid #ccc", width: "100%", fontSize: "0.95rem"}}
                                                />
                                                <input 
                                                    type="text" 
                                                    placeholder="Referencias (Ej. Casa verde de 2 pisos)" 
                                                    value={addressRef}
                                                    onChange={(e) => setAddressRef(e.target.value)}
                                                    style={{padding: "8px", borderRadius: "4px", border: "1px solid #ccc", width: "100%", fontSize: "0.95rem"}}
                                                />
                                                <input 
                                                    type="tel" 
                                                    placeholder="Teléfono de contacto*" 
                                                    value={addressPhone}
                                                    onChange={(e) => setAddressPhone(e.target.value)}
                                                    style={{padding: "8px", borderRadius: "4px", border: "1px solid #ccc", width: "100%", fontSize: "0.95rem"}}
                                                />
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="cart-total">
                        <h3>Total ({itemCount} {itemCount === 1 ? "artículo" : "artículos"})</h3>
                        <p id="totalAmount">${finalTotal.toFixed(2)}</p>
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
