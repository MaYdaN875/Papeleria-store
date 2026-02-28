/**
 * Lógica del carrito: almacenamiento en localStorage, agregar/quitar ítems,
 * sincronizar contadores en navbar y nav móvil (cartCount, mobileCartCount).
 */
import { syncStoreCart } from '../services/customerApi'
import { showNotification } from './notification'
import { getStoreCartOwnerKey, getStoreUserToken } from './storeSession'

const CART_STORAGE_PREFIX = 'cart'
const CART_COUNT_ID = 'cartCount'
const MOBILE_CART_COUNT_ID = 'mobileCartCount'

export interface CartItem {
    name: string
    price: string
    id: number
    quantity: number
    productId?: number
    image?: string
    /** Precio unitario menudeo (para calcular precio según cantidad). */
    basePrice?: string
    /** Precio unitario mayoreo. */
    mayoreoPrice?: string
    /** Cantidad mínima desde la que aplica mayoreo. */
    mayoreoMinQty?: number
}

/**
 * Precio unitario efectivo según cantidad (menudeo o mayoreo).
 */
export function getCartItemUnitPrice(item: CartItem): number {
    const qty = item.quantity || 1
    if (
        item.mayoreoMinQty != null &&
        item.mayoreoPrice != null &&
        String(item.mayoreoPrice).trim() !== '' &&
        qty >= item.mayoreoMinQty
    ) {
        return Number(item.mayoreoPrice) || 0
    }
    return Number(item.basePrice ?? item.price) || 0
}

/**
 * Subtotal del ítem (precio unitario efectivo × cantidad).
 */
export function getCartItemSubtotal(item: CartItem): number {
    return getCartItemUnitPrice(item) * (item.quantity || 1)
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

    const token = getStoreUserToken()
    if (!token) return

    const payload = items
        .filter((item) => item.productId && item.productId > 0)
        .map((item) => ({
            product_id: item.productId as number,
            quantity: item.quantity || 1,
        }))

    void syncStoreCart(token, payload)
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
 * Agrega un producto al carrito (localStorage). Si ya existe por productId o nombre+precio,
 * incrementa la cantidad. Opcionalmente recibe datos de mayoreo para que el carrito
 * aplique precio mayoreo cuando la cantidad lo alcance.
 * @param quantity - Cantidad de productos a agregar (por defecto 1)
 * @param mayoreo - basePrice (menudeo), mayoreoPrice, mayoreoMinQty para calcular precio en carrito
 */
export function addProductToCart(
    productName: string,
    productPrice: string,
    quantity: number = 1,
    productId?: number,
    productImage?: string,
    mayoreo?: { basePrice: string; mayoreoPrice: string; mayoreoMinQty: number }
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
        if (productImage && !existing.image) {
            existing.image = productImage
        }
        if (mayoreo) {
            if (existing.basePrice == null) existing.basePrice = mayoreo.basePrice
            if (existing.mayoreoPrice == null) existing.mayoreoPrice = mayoreo.mayoreoPrice
            if (existing.mayoreoMinQty == null) existing.mayoreoMinQty = mayoreo.mayoreoMinQty
        }
    } else {
        const newItem: CartItem = {
            name: productName,
            price: productPrice,
            id: Date.now(),
            quantity,
            productId,
            image: productImage,
        }
        if (mayoreo) {
            newItem.basePrice = mayoreo.basePrice
            newItem.mayoreoPrice = mayoreo.mayoreoPrice
            newItem.mayoreoMinQty = mayoreo.mayoreoMinQty
        }
        cart.push(newItem)
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

/**
 * Migra el carrito de invitado al usuario logeado.
 * Si el usuario ya tiene productos en su carrito, combina ambos aumentando las cantidades.
 * Se llama después de setStoreSession() en Login y SignUp.
 */
export function migrateGuestCartToUser(): void {
    const guestCartKey = getCartStorageKeyForOwner(null) // 'cart_guest'
    const guestCart = JSON.parse(globalThis.localStorage.getItem(guestCartKey) || '[]') as CartItem[]
    
    if (guestCart.length === 0) return // No hay carrito guest para migrar

    // Obtener el carrito del usuario logeado
    const userCart = getActiveCartItems()

    // Mezclar carritos: para cada producto del guest, sumarlo al carrito del usuario
    for (const guestItem of guestCart) {
        const existingIndex = userCart.findIndex((item) => {
            if (guestItem.productId && item.productId) {
                return item.productId === guestItem.productId
            }
            return item.name === guestItem.name && item.price === guestItem.price
        })

        if (existingIndex >= 0) {
            // Producto ya existe en el carrito del usuario, aumentar cantidad
            userCart[existingIndex].quantity = (userCart[existingIndex].quantity || 1) + (guestItem.quantity || 1)
        } else {
            // Producto nuevo, agregarlo
            userCart.push(guestItem)
        }
    }

    // Guardar el carrito mezclado en la clave del usuario
    saveActiveCartItems(userCart)

    // Limpiar el carrito guest
    globalThis.localStorage.removeItem(guestCartKey)

    // Actualizar el contador en el DOM
    syncCartCount()
}
