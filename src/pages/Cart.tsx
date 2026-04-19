import { Link, useNavigate } from "react-router"
import { CartEmpty, CartItem } from "../components/cart"
import { useCart } from "../hooks/useCart"
import { showNotification } from "../utils/notification"

export const Cart = () => {
    const navigate = useNavigate()

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

    const handleClearCart = () => {
        if (window.confirm("¿Estás seguro de que deseas eliminar todos los productos del carrito?")) {
            clearCart()
            showNotification("Carrito vaciado")
            window.scrollTo(0, 0)
        }
    }

    return (
        <main className="flex-grow pt-8 md:pt-16 pb-24 px-4 md:px-8 max-w-6xl mx-auto w-full font-body text-slate-800 bg-gray-50 min-h-screen">
            {/* Header Banner (Mobile Only) */}
            <div className="md:hidden bg-[#00897B] text-white py-4 px-6 mb-6 rounded-xl shadow-md text-center">
                <h1 className="font-headline font-bold text-2xl tracking-tight">Mi Carrito</h1>
            </div>

            {cartItems.length === 0 ? (
                <CartEmpty />
            ) : (
                <>
                    <header className="mb-8 hidden md:flex items-center justify-between">
                        <h1 className="font-headline font-bold text-3xl text-slate-800 tracking-tight mb-2">
                            Mi Carrito ({itemCount} {itemCount === 1 ? 'Artículo' : 'Artículos'})
                        </h1>
                        <button
                            onClick={handleClearCart}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors font-medium text-sm"
                        >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                            Vaciar todo
                        </button>
                    </header>

                    {sessionExpired && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 mb-6 flex items-start gap-3">
                            <span className="material-symbols-outlined text-amber-600">warning</span>
                            <div className="text-sm">
                                Tu sesión expiró. Tus productos siguen aquí.{" "}
                                <Link to="/login?returnTo=/cart" className="font-bold underline hover:text-amber-900">
                                    Inicia sesión de nuevo
                                </Link>{" "}
                                para sincronizar tu carrito.
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Cart Items List */}
                        <div className="lg:col-span-8 flex flex-col space-y-6">
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

                        {/* Order Summary */}
                        <div className="lg:col-span-4 mt-8 lg:mt-0">
                            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 sticky top-32">
                                <h3 className="font-headline font-bold text-xl text-slate-800 mb-6">Resumen</h3>
                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between items-center text-base text-slate-800">
                                        <span>Total ({itemCount} {itemCount === 1 ? 'artículo' : 'artículos'})</span>
                                        <span className="font-bold text-2xl text-slate-900">${total.toFixed(2)}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">
                                      Los costos de envío se calculan en el siguiente paso.
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate("/checkout")}
                                    className="w-full bg-[#00897B] text-white rounded-lg py-3 px-4 font-headline font-bold text-base hover:bg-teal-700 transition-colors duration-200 text-center shadow-sm"
                                >
                                    Proceder al pago
                                </button>
                                
                                <button
                                    onClick={() => navigate("/")}
                                    className="w-full mt-3 bg-white text-[#00897B] border border-[#00897B] rounded-lg py-3 px-4 font-headline font-bold text-base hover:bg-teal-50 transition-colors duration-200 text-center"
                                >
                                    Continuar comprando
                                </button>
                                
                                <div className="md:hidden mt-6 pt-4 border-t border-slate-100 flex justify-center">
                                    <button
                                        onClick={handleClearCart}
                                        className="flex items-center gap-2 text-red-500 hover:text-red-700 font-medium text-sm"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                        Vaciar carrito
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </main>
    )
}
