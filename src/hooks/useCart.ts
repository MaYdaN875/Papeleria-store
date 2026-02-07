import { useCallback, useEffect, useState } from "react"
import type { CartItem } from "../utils/cart"

const CART_STORAGE_KEY = "cart"
const CART_COUNT_ID = "cartCount"

/**
 * Hook para gestionar el estado del carrito (localStorage).
 * Sincroniza con el DOM (cartCount) y escucha eventos storage/cartUpdated.
 */
export function useCart() {
    const [cartItems, setCartItems] = useState<CartItem[]>([])
    const [removingId, setRemovingId] = useState<number | null>(null)
    const [isFirstLoad, setIsFirstLoad] = useState(true)

    const loadCart = useCallback(() => {
        const cart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]")
        const updatedCart = cart.map((item: CartItem) => ({
            ...item,
            quantity: item.quantity || 1,
        }))
        setCartItems(updatedCart)
        setIsFirstLoad(false)
    }, [])

    useEffect(() => {
        loadCart()

        window.addEventListener("storage", loadCart)
        window.addEventListener("cartUpdated", loadCart)

        return () => {
            window.removeEventListener("storage", loadCart)
            window.removeEventListener("cartUpdated", loadCart)
        }
    }, [loadCart])

    useEffect(() => {
        if (!isFirstLoad) {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems))
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
            setCartItems((prev) => {
                const updated = prev.filter((item) => item.id !== id)
                return updated
            })
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
        clearCart,
    }
}
