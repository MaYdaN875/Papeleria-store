
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
    const [removingId, setRemovingId] = useState<number | null>(null)
    const [isFirstLoad, setIsFirstLoad] = useState(true)
    const navigate = useNavigate()

    // Función para cargar el carrito desde localStorage
    const loadCart = () => {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]')
        setCartItems(cart)
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
            cartCount.textContent = cartItems.length.toString()
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
       FUNCIÓN: updateCartTotal
       Actualiza el total del carrito
       Suma los precios de todos los productos
       ================================ */
    const updateCartTotal = (items: CartItem[]) => {
        let total = 0
        
        // Iterar sobre cada item y sumar los precios
        items.forEach(item => {
            const price = Number.parseFloat(item.price)
            total += price
        })
        
        // Actualizar el elemento del total en la página
        const totalAmount = document.getElementById('totalAmount')
        if (totalAmount) {
            totalAmount.textContent = total.toFixed(2) + '$'
        }
        
        // Actualizar el título con la cantidad de items
        const itemCount = items.length
        const cartTitle = document.getElementById('cartTitle')
        if (cartTitle) {
            cartTitle.textContent = `Mi Carrito (${itemCount} Artículos)`
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

            {/* ============ BOTÓN FLOTANTE WHATSAPP ============ */}
            {/* Botón fijo en la esquina inferior derecha para contacto por WhatsApp */}
            <a href="https://wa.me/1234567890" className="whatsapp-btn" target="_blank" rel="noopener noreferrer" title="Contactanos por WhatsApp">
                <i className="fab fa-whatsapp"></i>
            </a>
        </main>
    )
}
