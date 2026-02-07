import { showNotification } from './notification'

const CART_STORAGE_KEY = 'cart'
const CART_COUNT_ID = 'cartCount'

export interface CartItem {
    name: string
    price: string
    id: number
    quantity: number
}

/**
 * Agrega un producto al carrito (localStorage). Si ya existe por nombre+precio,
 * incrementa la cantidad. Actualiza el contador del header y muestra notificación.
 * @param quantity - Cantidad de productos a agregar (por defecto 1)
 */
export function addProductToCart(productName: string, productPrice: string, quantity: number = 1): void {
    const cart: CartItem[] = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]')
    const existing = cart.find(
        (item) => item.name === productName && item.price === productPrice
    )

    if (existing) {
        existing.quantity = (existing.quantity || 1) + quantity
    } else {
        cart.push({
            name: productName,
            price: productPrice,
            id: Date.now(),
            quantity,
        })
    }

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))

    const cartCount = document.getElementById(CART_COUNT_ID)
    if (cartCount) {
        const totalItems = cart.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0)
        cartCount.textContent = totalItems.toString()
        cartCount.style.animation = 'none'
        setTimeout(() => {
            cartCount.style.animation = 'scaleIn 0.3s ease'
        }, 10)
    }

    // Mostrar notificación con cantidad si es > 1
    const message = quantity > 1 
        ? `${quantity}x ${productName} agregado al carrito!`
        : `${productName} agregado al carrito!`
    showNotification(message)
    
    // Lanzar evento personalizado para sincronizar en otras ventanas
    window.dispatchEvent(new Event('cartUpdated'))
}

/**
 * Sincroniza el contador del carrito en el DOM con el valor en localStorage.
 * Útil al cargar la página (ej. en Home o AllProducts).
 */
/**
 * Sincroniza el contador del carrito en el DOM con el valor en localStorage.
 * Usa la suma de cantidades (no el número de líneas).
 */
export function syncCartCount(): void {
    const cart: CartItem[] = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]')
    const cartCount = document.getElementById(CART_COUNT_ID)
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0)
        cartCount.textContent = totalItems.toString()
    }
}
