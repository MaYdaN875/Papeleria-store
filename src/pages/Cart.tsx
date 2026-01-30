
import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router"

/* ================================
   COMPONENTE: Cart
   Página del carrito de compras
   ================================ */

interface CartItem {
    name: string
    price: string
    id: number
}

export const Cart = () => {
    const [cartItems, setCartItems] = useState<CartItem[]>([])
    const navigate = useNavigate()

    useEffect(() => {
        // Cargar carrito desde localStorage
        const cart = JSON.parse(localStorage.getItem('cart') || '[]')
        setCartItems(cart)

        // Actualizar contador del carrito
        const cartCount = document.getElementById('cartCount')
        if (cartCount) {
            cartCount.textContent = cart.length.toString()
        }
    }, [])

    /* ================================
       FUNCIÓN: removeItem
       Elimina un producto del carrito
       Parámetro:
       - id: ID del producto a eliminar
       ================================ */
    const removeItem = (id: number) => {
        const itemElement = document.querySelector(`[data-id="${id}"]`)

        if (itemElement) {
            ;(itemElement as HTMLElement).style.opacity = "0"
            ;(itemElement as HTMLElement).style.transform = "translateX(100%)"
            ;(itemElement as HTMLElement).style.transition = "all 0.3s ease"

            setTimeout(() => {
                const updatedCart = cartItems.filter((item) => item.id !== id)
                setCartItems(updatedCart)
                localStorage.setItem("cart", JSON.stringify(updatedCart))

                const cartCount = document.getElementById("cartCount")
                if (cartCount) {
                    cartCount.textContent = updatedCart.length.toString()
                }
            }, 300)
        }
    }

    /* ================================
       FUNCIÓN: showNotification
       Muestra una notificación temporal
       Parámetro:
       - message: mensaje a mostrar
       ================================ */
    const showNotification = (message: string) => {
        // Crear elemento de notificación
        const notification = document.createElement('div')
        notification.className = 'notification'
        notification.textContent = message

        document.body.appendChild(notification)

        // Quitar la notificación después de 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease'
            setTimeout(() => {
                notification.remove()
            }, 300)
        }, 3000)
    }

    const handleCheckout = () => {
        showNotification('¡Procesando tu compra! Pronto serás redirigido al pago')
        setTimeout(() => {
            navigate('/')
        }, 2000)
    }

    // Calcular total
    let total = 0
    cartItems.forEach(item => {
        total += Number.parseFloat(item.price)
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
                        <img src="/src/imagenes/imagen.png" alt="Carrito vacío" style={{ width: 300, height: 300, margin: '0 auto', display: 'block' }} />
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
                    <h2 id="cartTitle">Mi Carrito ({cartItems.length} Artículos)</h2>

                    {/* Lista de productos en el carrito */}
                    <div className="cart-items">
                        {cartItems.map((item) => (
                            <div key={item.id} className="cart-item" data-id={item.id}>
                                {/* Imagen del producto */}
                                <div className="item-image"></div>

                                {/* Información del producto */}
                                <div className="item-info">
                                    <h4>{item.name}</h4>
                                    <p className="item-price">${item.price}</p>
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
                        <Link to="/" className="btn-continue">Continuar comprando</Link>
                        <button className="btn-checkout" onClick={handleCheckout}>Proceder al pago</button>
                    </div>
                </div>
            )}

            {/* ============ BOTÓN FLOTANTE WHATSAPP ============ */}
            {/* Botón fijo en la esquina inferior derecha para contacto por WhatsApp */}
            <a href="https://wa.me/1234567890" className="whatsapp-btn" target="_blank" rel="noopener noreferrer" title="Contactanos por WhatsApp">
                <i className="fab fa-whatsapp"></i>
            </a>
        </main>
    )
}
