/**
 * Lógica del carrito: almacenamiento en localStorage, agregar/quitar ítems,
 * sincronizar contadores en navbar y nav móvil (cartCount, mobileCartCount).
 */
import { showNotification } from './notification'
import { getStoreCartOwnerKey } from './storeSession'

const CART_STORAGE_PREFIX = 'cart'
const CART_COUNT_ID = 'cartCount'
const MOBILE_CART_COUNT_ID = 'mobileCartCount'

export interface CartItem {
    name: string
    price: string
    id: number
    quantity: number
    productId?: number
}

function getCartStorageKeyForOwner(ownerKey: string | null): string {
    return ownerKey ? `${CART_STORAGE_PREFIX}_${ownerKey}` : `${CART_STORAGE_PREFIX}_guest`
}

export function getActiveCartStorageKey(): string {
    return getCartStorageKeyForOwner(getStoreCartOwnerKey())
}

export function getActiveCartItems(): CartItem[] {
    const key = getActiveCartStorageKey()
    const storedValue = globalThis.localStorage.getItem(key)
    const parsedCart = JSON.parse(storedValue || '[]') as CartItem[]
    return parsedCart.map((item) => ({
        ...item,
        quantity: item.quantity || 1,
    }))
}

export function saveActiveCartItems(items: CartItem[]): void {
    const key = getActiveCartStorageKey()
    globalThis.localStorage.setItem(key, JSON.stringify(items))
}

/**
 * Actualiza todos los contadores del carrito en el DOM
 * @param totalItems - Cantidad total de items en el carrito
 */
function updateAllCartCounts(totalItems: number): void {
    // Actualizar contador del desktop
    const cartCount = document.getElementById(CART_COUNT_ID)
    if (cartCount) {
        cartCount.textContent = totalItems.toString()
        cartCount.style.animation = 'none'
        setTimeout(() => {
            cartCount.style.animation = 'scaleIn 0.3s ease'
        }, 10)
    }

    // Actualizar contador del móvil
    const mobileCartCount = document.getElementById(MOBILE_CART_COUNT_ID)
    if (mobileCartCount) {
        mobileCartCount.textContent = totalItems.toString()
        mobileCartCount.dataset.count = totalItems.toString()
        if (totalItems > 0) {
            mobileCartCount.style.animation = 'none'
            setTimeout(() => {
                mobileCartCount.style.animation = 'badgePulse 0.6s ease infinite'
            }, 10)
        }
    }
}

/**
 * Agrega un producto al carrito (localStorage). Si ya existe por nombre+precio,
 * incrementa la cantidad. Actualiza el contador del header y muestra notificación.
 * @param quantity - Cantidad de productos a agregar (por defecto 1)
 */
export function addProductToCart(
    productName: string,
    productPrice: string,
    quantity: number = 1,
    productId?: number
): void {
    const cart = getActiveCartItems()
    const existing = cart.find(
        (item) => {
            if (productId && item.productId) return item.productId === productId
            return item.name === productName && item.price === productPrice
        }
    )

    if (existing) {
        existing.quantity = (existing.quantity || 1) + quantity
    } else {
        cart.push({
            name: productName,
            price: productPrice,
            id: Date.now(),
            quantity,
            productId,
        })
    }

    saveActiveCartItems(cart)

    // Actualizar todos los contadores
    const totalItems = cart.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0)
    updateAllCartCounts(totalItems)

    // Mostrar notificación con cantidad si es > 1
    const message = quantity > 1 
        ? `${quantity}x ${productName} agregado al carrito!`
        : `${productName} agregado al carrito!`
    showNotification(message)
    
    // Lanzar evento personalizado para sincronizar en otras ventanas
    globalThis.dispatchEvent(new Event('cartUpdated'))
}

/**
 * Sincroniza el contador del carrito en el DOM con el valor en localStorage.
 * Útil al cargar la página (ej. en Home o AllProducts).
 * Usa la suma de cantidades (no el número de líneas).
 */
export function syncCartCount(): void {
    const cart = getActiveCartItems()
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0)
    updateAllCartCounts(totalItems)
}
