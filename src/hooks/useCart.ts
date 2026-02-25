import { useCallback, useEffect, useState } from "react"
import {
    getActiveCartItems,
    saveActiveCartItems,
    syncCartCount,
    type CartItem,
} from "../utils/cart"
import { getStoreAuthChangedEventName, getStoreUserToken } from "../utils/storeSession"
import { fetchStoreCart } from "../services/customerApi"

const CART_COUNT_ID = "cartCount"

function removeCartItemById(items: CartItem[], id: number): CartItem[] {
    return items.filter((item) => item.id !== id)
}

/**
 * Hook para gestionar el estado del carrito (localStorage).
 * Sincroniza con el DOM (cartCount) y escucha eventos storage/cartUpdated.
 */
export function useCart() {
    const [cartItems, setCartItems] = useState<CartItem[]>([])
    const [removingId, setRemovingId] = useState<number | null>(null)
    const [isFirstLoad, setIsFirstLoad] = useState(true)

    const loadCart = useCallback(() => {
        const localItems = getActiveCartItems()
        setCartItems(localItems)

        const token = getStoreUserToken()
        if (!token) {
            // Invitado: solo usamos carrito local.
            setIsFirstLoad(false)
            return
        }

        void (async () => {
            const result = await fetchStoreCart(token)

            if (result.ok && result.items && result.items.length > 0) {
                const serverItems: CartItem[] = result.items.map((item) => ({
                    id: Date.now() + item.product_id,
                    name: item.name ?? "",
                    price: item.price ?? "0",
                    quantity: item.quantity || 1,
                    productId: item.product_id,
                }))

                setCartItems(serverItems)
            }

            // A partir de aquí, lo que haya en estado es la fuente de verdad.
            setIsFirstLoad(false)
            syncCartCount()
        })()
    }, [])

    useEffect(() => {
        loadCart()

        globalThis.addEventListener("storage", loadCart)
        globalThis.addEventListener("cartUpdated", loadCart)
        globalThis.addEventListener(getStoreAuthChangedEventName(), loadCart)

        return () => {
            globalThis.removeEventListener("storage", loadCart)
            globalThis.removeEventListener("cartUpdated", loadCart)
            globalThis.removeEventListener(getStoreAuthChangedEventName(), loadCart)
        }
    }, [loadCart])

    useEffect(() => {
        if (!isFirstLoad) {
            saveActiveCartItems(cartItems)
            syncCartCount()
        }

        const cartCount = document.getElementById(CART_COUNT_ID)
        if (cartCount) {
            const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)
            cartCount.textContent = totalItems.toString()
        }
    }, [cartItems, isFirstLoad])

    const removeItem = useCallback((id: number) => {
        setRemovingId(id)
        setTimeout(() => {
            setCartItems((prev) => removeCartItemById(prev, id))
            setRemovingId(null)
        }, 300)
    }, [])

    const updateQuantity = useCallback(
        (id: number, delta: number) => {
            setCartItems((prevItems) => {
                const item = prevItems.find((i) => i.id === id)
                if (!item) return prevItems
                const newQuantity = item.quantity + delta
                if (newQuantity < 1) {
                    removeItem(id)
                    return prevItems
                }
                return prevItems.map((i) =>
                    i.id === id ? { ...i, quantity: newQuantity } : i
                )
            })
        },
        [removeItem]
    )

    const setQuantity = useCallback((id: number, value: number) => {
        if (value < 1) {
            removeItem(id)
            return
        }
        setCartItems((prev) =>
            prev.map((i) =>
                i.id === id ? { ...i, quantity: Math.min(value, 99) } : i
            )
        )
    }, [removeItem])

    const clearCart = useCallback(() => {
        setCartItems([])
    }, [])

    const total = cartItems.reduce(
        (sum, item) => sum + Number.parseFloat(item.price) * item.quantity,
        0
    )

    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

    return {
        cartItems,
        total,
        itemCount,
        removingId,
        removeItem,
        updateQuantity,
        setQuantity,
        clearCart,
    }
}
