import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router"
import type { CartItem } from "../utils/cart"
import { showNotification } from "../utils/notification"

/* ================================
   COMPONENTE: Cart
   Página del carrito de compras
   ================================ */

export const Cart = () => {
    const [cartItems, setCartItems] = useState<CartItem[]>([])
    const [removingId, setRemovingId] = useState<number | null>(null)
    const [isFirstLoad, setIsFirstLoad] = useState(true)
    const navigate = useNavigate()

    // Función para cargar el carrito desde localStorage
    const loadCart = () => {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]')
        // Asegurar que todos los items tengan cantidad (para compatibilidad)
        const updatedCart = cart.map((item: CartItem) => ({
            ...item,
            quantity: item.quantity || 1
        }))
        setCartItems(updatedCart)
        setIsFirstLoad(false)
    }

    // Cargar carrito desde localStorage al montar
    useEffect(() => {
        loadCart()

        // Escuchar cambios en localStorage desde otras pestañas/ventanas
        window.addEventListener('storage', loadCart)

        // Escuchar evento personalizado cuando se agrega un producto
        window.addEventListener('cartUpdated', loadCart)

        return () => {
            window.removeEventListener('storage', loadCart)
            window.removeEventListener('cartUpdated', loadCart)
        }
    }, [])

    // Actualizar localStorage cuando cambian los items (pero solo después de la primera carga)
    useEffect(() => {
        if (!isFirstLoad) {
            localStorage.setItem('cart', JSON.stringify(cartItems))
        }

        const cartCount = document.getElementById('cartCount')
        if (cartCount) {
            const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)
            cartCount.textContent = totalItems.toString()
        }
    }, [cartItems, isFirstLoad])

    /* ================================
       FUNCIÓN: removeItem
       Elimina un producto del carrito
       Parámetro:
       - id: ID del producto a eliminar
       ================================ */
    const removeItem = (id: number) => {
        // Marcar el item para animación
        setRemovingId(id)

        // Esperar a que termine la animación antes de quitar
        setTimeout(() => {
            const updatedCart = cartItems.filter(item => item.id !== id)
            setCartItems(updatedCart)
            setRemovingId(null)
        }, 300)
    }

    /* ================================
       FUNCIÓN: updateQuantity
       Actualiza la cantidad de un producto en el carrito
       Parámetros:
       - id: ID del producto
       - delta: cantidad a sumar o restar (1 o -1)
       ================================ */
    const updateQuantity = (id: number, delta: number) => {
        setCartItems(prevItems =>
            prevItems.map(item => {
                if (item.id === id) {
                    const newQuantity = item.quantity + delta;
                    if (newQuantity < 1) {
                        removeItem(id);
                        return item;
                    }
                    return { ...item, quantity: newQuantity };
                }
                return item;
            })
        )
    }

    const handleCheckout = () => {
        showNotification('¡Procesando tu compra! Pronto serás redirigido al pago')
        setTimeout(() => {
            navigate('/')
        }, 2000)
    }

    /* ================================
       FUNCIÓN: clearCart
       Elimina todos los productos del carrito
       ================================ */
    const clearCart = () => {
        // Confirmación antes de limpiar
        if (window.confirm('¿Estás seguro de que deseas eliminar todos los productos del carrito?')) {
            setCartItems([])
            showNotification('Carrito vaciado')
        }
    }

    // Calcular total
    let total = 0
    cartItems.forEach(item => {
        total += Number.parseFloat(item.price) * item.quantity
    })

    return (
        <main className="cart-main">
            {cartItems.length === 0 ? (
                // Contenedor del carrito vacío
                <div className="cart-empty-container">
                    {/* Título del carrito */}
                    <h2>Mi Carrito</h2>

                    {/* Mensaje cuando el carrito está vacío */}
                    <div className="empty-message">
                        <p>Tu Carrito Está Vacío</p>
                        <p>Tenemos Grandes Ofertas Que Podrían Interesarte. ¡Elige Lo Que Necesitas!</p>
                    </div>

                    {/* Icono de carrito vacío (imagen proporcionada) */}
                    <div className="empty-cart-icon">
                        <img src="/src/imagenes/carrito.png" alt="Carrito vacío" style={{ width: 300, height: 300, margin: '0 auto', display: 'block' }} />
                    </div>

                    {/* Texto que indica que el carrito está vacío */}
                    <p className="nothing-here">Nada aquí</p>

                    {/* Botón para volver a la tienda */}
                    <Link to="/" className="btn-return">Volver a la tienda</Link>
                </div>
            ) : (
                // Contenedor del carrito con productos
                <div className="cart-full-container">
                    {/* Título del carrito con cantidad de artículos */}
                    <h2 id="cartTitle">Mi Carrito ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} Artículos)</h2>

                    {/* Lista de productos en el carrito */}
                    <div className="cart-items">
                        {cartItems.map((item) => (
                            <div
                                key={item.id}
                                className="cart-item"
                                data-id={item.id}
                                style={removingId === item.id ? {
                                    opacity: '0',
                                    transform: 'translateX(100%)',
                                    transition: 'all 0.3s ease'
                                } : {}}
                            >
                                {/* Imagen del producto */}
                                <div className="item-image"></div>

                                {/* Información del producto */}
                                <div className="item-info">
                                    <h4>{item.name}</h4>
                                    <p className="item-price">${item.price}</p>
                                </div>

                                {/* Controles de cantidad */}
                                <div className="item-quantity-controls">
                                    <button
                                        className="btn-quantity-minus"
                                        onClick={() => updateQuantity(item.id, -1)}
                                        title="Disminuir cantidad"
                                    >
                                        <i className="fas fa-minus"></i>
                                    </button>
                                    <span className="quantity-display">{item.quantity}</span>
                                    <button
                                        className="btn-quantity-plus"
                                        onClick={() => updateQuantity(item.id, 1)}
                                        title="Aumentar cantidad"
                                    >
                                        <i className="fas fa-plus"></i>
                                    </button>
                                </div>

                                {/* Subtotal del producto */}
                                <div className="item-subtotal">
                                    ${(Number.parseFloat(item.price) * item.quantity).toFixed(2)}
                                </div>

                                {/* Botón para eliminar el producto */}
                                <button
                                    className="btn-remove"
                                    onClick={() => removeItem(item.id)}
                                    title="Eliminar del carrito"
                                >
                                    <i className="fas fa-trash"></i>
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Sección del total */}
                    <div className="cart-total">
                        <h3>Total</h3>
                        <p id="totalAmount">{total.toFixed(2)}$</p>
                    </div>

                    {/* Botones de acción del carrito */}
                    <div className="cart-actions">
                        <button className="btn-clear-cart" onClick={clearCart} title="Eliminar todos los productos">
                            <i className="fas fa-trash-alt"></i> Eliminar todo
                        </button>
                        <Link to="/" className="btn-continue">Continuar comprando</Link>
                        <button className="btn-checkout" onClick={handleCheckout}>Proceder al pago</button>
                    </div>
                </div>
            )}


        </main>
    )
}
