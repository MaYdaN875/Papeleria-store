import { showNotification } from './notification'

const CART_STORAGE_KEY = 'cart'
const CART_COUNT_ID = 'cartCount'

/**
 * Agrega un producto al carrito (localStorage), actualiza el contador del header
 * y muestra una notificación.
 */
export function addProductToCart(productName: string, productPrice: string): void {
    const cart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]')

    cart.push({
        name: productName,
        price: productPrice,
        id: Date.now(),
    })

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))

    const cartCount = document.getElementById(CART_COUNT_ID)
    if (cartCount) {
        cartCount.textContent = cart.length.toString()
        cartCount.style.animation = 'none'
        setTimeout(() => {
            cartCount.style.animation = 'scaleIn 0.3s ease'
        }, 10)
    }

    showNotification(`${productName} agregado al carrito!`)
}

/**
 * Sincroniza el contador del carrito en el DOM con el valor en localStorage.
 * Útil al cargar la página (ej. en Home o AllProducts).
 */
export function syncCartCount(): void {
    const cart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]')
    const cartCount = document.getElementById(CART_COUNT_ID)
    if (cartCount) {
        cartCount.textContent = cart.length.toString()
    }
}
