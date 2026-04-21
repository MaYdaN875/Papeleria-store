import { useState } from "react"
import { useNavigate } from "react-router"
import { useCart } from "../hooks/useCart"
import { createCheckoutSession, validateShippingLocation } from "../services/customerApi"
import { showNotification } from "../utils/notification"
import { getStoreUser, getStoreUserToken, isStoreUserLoggedIn } from "../utils/storeSession"

export const Checkout = () => {
    const navigate = useNavigate()
    const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)
    const [checkoutError, setCheckoutError] = useState("")
    const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery">("pickup")
    const [isValidatingLocation, setIsValidatingLocation] = useState(false)
    const [locationValidated, setLocationValidated] = useState(false)
    const [locationMessage, setLocationMessage] = useState("")

    const user = getStoreUser()
    const [useSavedAddress, setUseSavedAddress] = useState(!!user?.default_delivery_address)
    const [addressStreet, setAddressStreet] = useState("")
    const [addressColony, setAddressColony] = useState("")
    const [addressRef, setAddressRef] = useState("")
    const [addressPhone, setAddressPhone] = useState("")
    
    const { cartItems, total, itemCount, clearCart } = useCart()

    const finalTotal = deliveryMethod === "delivery" ? total + 10 : total

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
            navigate("/login?returnTo=/checkout", { replace: true })
            return
        }

        const itemsWithId = cartItems.filter((item) => item.productId != null && item.productId > 0)
        const missingId = cartItems.some((item) => !item.productId || item.productId <= 0)
        
        if (missingId && itemsWithId.length === 0) {
            setCheckoutError("Ningún producto tiene ID válido.")
            return
        }

        const token = getStoreUserToken()
        if (!token) {
            navigate("/login?returnTo=/checkout", { replace: true })
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

    if (cartItems.length === 0) {
        return (
            <main className="flex-grow pt-16 pb-24 px-4 max-w-4xl mx-auto w-full font-body text-slate-800 flex flex-col items-center">
                <h2 className="font-headline font-bold text-3xl mb-4">No hay artículos para pagar</h2>
                <button onClick={() => navigate("/")} className="bg-[#00897B] text-white px-6 py-2 rounded-lg">
                    Volver a la tienda
                </button>
            </main>
        )
    }

    return (
        <main className="flex-grow pt-8 md:pt-12 pb-32 md:pb-24 px-4 md:px-8 max-w-4xl mx-auto w-full font-body text-slate-800">
            <header className="mb-8">
                <h1 className="font-headline font-bold text-3xl text-slate-900 tracking-tight">Proceso de Pago</h1>
                <p className="text-slate-500 mt-2">Completa los detalles para finalizar tu compra</p>
            </header>

            <div className="space-y-8">
                {/* Delivery Method */}
                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-4 font-headline flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#00897B]">local_shipping</span>
                        Método de entrega
                    </h2>
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-slate-800">
                        <label className={`flex items-center p-4 border-b border-slate-100 cursor-pointer transition-colors ${deliveryMethod === "pickup" ? 'bg-teal-50/30' : 'hover:bg-slate-50'}`}>
                            <div className="relative flex items-center">
                                <input 
                                    className="peer sr-only" 
                                    name="delivery" 
                                    type="radio" 
                                    checked={deliveryMethod === "pickup"}
                                    onChange={() => setDeliveryMethod("pickup")}
                                />
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${deliveryMethod === "pickup" ? 'border-[#00897B] bg-[#00897B]' : 'border-slate-300'}`}>
                                    <span className={`material-symbols-outlined text-white text-[16px] ${deliveryMethod === "pickup" ? 'opacity-100' : 'opacity-0'}`}>check</span>
                                </div>
                            </div>
                            <span className="ml-4 flex-grow font-medium">Recoger en tienda (Gratis)</span>
                            {deliveryMethod === "pickup" && <span className="material-symbols-outlined text-[#00897B]">storefront</span>}
                        </label>
                        
                        <label className={`flex items-center p-4 cursor-pointer transition-colors ${deliveryMethod === "delivery" ? 'bg-teal-50/30' : 'hover:bg-slate-50'}`}>
                            <div className="relative flex items-center">
                                <input 
                                    className="peer sr-only" 
                                    name="delivery" 
                                    type="radio"
                                    checked={deliveryMethod === "delivery"}
                                    onChange={() => setDeliveryMethod("delivery")}
                                />
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${deliveryMethod === "delivery" ? 'border-[#00897B] bg-[#00897B]' : 'border-slate-300'}`}>
                                    <span className={`material-symbols-outlined text-white text-[16px] ${deliveryMethod === "delivery" ? 'opacity-100' : 'opacity-0'}`}>check</span>
                                </div>
                            </div>
                            <span className="ml-4 font-medium">Envío a domicilio (+$10.00 MXN)</span>
                        </label>
                    </div>
                </section>

                {/* Shipping Details for Delivery */}
                {deliveryMethod === "delivery" && (
                    <section className="animate-fade-in bg-slate-50 rounded-xl p-6 border border-slate-200">
                        <h3 className="font-headline font-bold text-lg text-slate-800 mb-4">Validación de Zona</h3>
                        
                        {!locationValidated ? (
                            <div className="space-y-4">
                                <p className="text-sm text-slate-600">Para el envío a domicilio, necesitamos validar por GPS que te encuentras a máximo 1km de nuestra sucursal.</p>
                                <button 
                                    type="button" 
                                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors text-sm"
                                    onClick={handleValidateLocation}
                                    disabled={isValidatingLocation}
                                >
                                    <span className="material-symbols-outlined text-sm">my_location</span>
                                    {isValidatingLocation ? "Obteniendo ubicación..." : "Validar mi ubicación GPS"}
                                </button>
                                {locationMessage && (
                                    <p className="text-sm text-red-500 font-medium bg-red-50 p-3 rounded-lg border border-red-100 mt-3">{locationMessage}</p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 text-green-600 font-medium bg-green-50 p-4 rounded-lg border border-green-200">
                                    <span className="material-symbols-outlined">check_circle</span>
                                    ¡Estás en nuestra zona de envío!
                                </div>
                                
                                <div>
                                    <h4 className="font-bold text-slate-800 mb-3 text-lg">Dirección de Entrega</h4>
                                    
                                    {useSavedAddress && user?.default_delivery_address ? (
                                        <div className="bg-white border border-[#00897B] rounded-lg p-4">
                                            <p className="font-semibold text-slate-800 mb-1">Dirección Guardada:</p>
                                            <p className="text-slate-600 mb-4 text-sm">{user.default_delivery_address}</p>
                                            <button 
                                                onClick={() => setUseSavedAddress(false)}
                                                className="text-sm text-[#00897B] font-medium hover:underline"
                                            >
                                                Usar otra dirección
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {user?.default_delivery_address && (
                                                <button 
                                                    onClick={() => setUseSavedAddress(true)}
                                                    className="bg-transparent border border-[#00897B] text-[#00897B] hover:bg-teal-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    Usar dirección de mi cuenta
                                                </button>
                                            )}
                                            
                                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                                                <input 
                                                    className="w-full px-4 py-3.5 border-0 focus:ring-0 focus:outline-none text-slate-800 placeholder-slate-400 font-medium bg-transparent"
                                                    placeholder="Calle y Número (Ej. Av. Hidalgo 123)*" 
                                                    value={addressStreet}
                                                    onChange={(e) => setAddressStreet(e.target.value)}
                                                    type="text" 
                                                />
                                                <input 
                                                    className="w-full px-4 py-3.5 border-0 focus:ring-0 focus:outline-none text-slate-800 placeholder-slate-400 font-medium bg-transparent"
                                                    placeholder="Colonia y Código Postal*" 
                                                    value={addressColony}
                                                    onChange={(e) => setAddressColony(e.target.value)}
                                                    type="text" 
                                                />
                                                <input 
                                                    className="w-full px-4 py-3.5 border-0 focus:ring-0 focus:outline-none text-slate-800 placeholder-slate-400 font-medium bg-transparent"
                                                    placeholder="Referencias (Ej. Casa verde 2 pisos)" 
                                                    value={addressRef}
                                                    onChange={(e) => setAddressRef(e.target.value)}
                                                    type="text" 
                                                />
                                                <input 
                                                    className="w-full px-4 py-3.5 border-0 focus:ring-0 focus:outline-none text-slate-800 placeholder-slate-400 font-medium bg-transparent"
                                                    placeholder="Teléfono de Contacto*" 
                                                    value={addressPhone}
                                                    onChange={(e) => setAddressPhone(e.target.value)}
                                                    type="tel" 
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {checkoutError && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 flex gap-2">
                        <span className="material-symbols-outlined">error</span>
                        <p>{checkoutError}</p>
                    </div>
                )}
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex justify-end gap-4 mt-12 pt-8 border-t border-slate-200">
                <button
                    onClick={() => {
                        if (window.confirm("¿Vaciar carrito y salir?")) {
                            clearCart()
                            navigate("/")
                        }
                    }}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors font-medium"
                >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                    Vaciar y salir
                </button>
                <button
                    onClick={() => navigate("/cart")}
                    className="px-6 py-2.5 rounded-full border border-[#00897B] text-[#00897B] hover:bg-teal-50 transition-colors font-medium"
                >
                    Volver al carrito
                </button>
                <button
                    onClick={() => void handleCheckout()}
                    disabled={isCheckoutLoading || (deliveryMethod === "delivery" && !locationValidated)}
                    className="px-8 py-2.5 rounded-full bg-[#00897B] text-white hover:bg-[#007064] transition-colors font-bold shadow-md disabled:bg-slate-300 disabled:shadow-none"
                >
                    {isCheckoutLoading ? "Procesando..." : "Proceder a pagar la orden"}
                </button>
            </div>
            
            {/* Mobile Sticky Footer Summary */}
            <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#00897B] text-white rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)] z-40 p-6 space-y-4 pb-8">
                <div className="space-y-1">
                    <div className="flex justify-between text-teal-50/80 text-sm">
                        <span>Subtotal ({itemCount} artículo{itemCount !== 1 ? 's' : ''}):</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-teal-50/80 text-sm">
                        <span>Envío:</span>
                        <span>{deliveryMethod === "delivery" ? "$10.00" : "Gratis"}</span>
                    </div>
                    <div className="flex justify-between font-bold text-xl pt-2 border-t border-teal-600/50 mt-2">
                        <span>Total:</span>
                        <span>${finalTotal.toFixed(2)}</span>
                    </div>
                </div>
                <button
                    onClick={() => void handleCheckout()}
                    disabled={isCheckoutLoading || (deliveryMethod === "delivery" && !locationValidated)}
                    className="w-full bg-white text-[#00897B] font-bold py-4 rounded-xl text-lg hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isCheckoutLoading ? "Cargando..." : "Pagar por Stripe"}
                </button>
            </div>
        </main>
    )
}
