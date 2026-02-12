import { useEffect, useRef } from "react"

interface TouchCarouselConfig {
    /** Función que se ejecuta cuando se hace swipe a la derecha */
    onSwipeLeft: () => void
    /** Función que se ejecuta cuando se hace swipe a la izquierda */
    onSwipeRight: () => void
    /** Distancia mínima en píxeles para considerar un swipe válido (por defecto 50) */
    minSwipeDistance?: number
}

/**
 * Hook personalizado para manejar gestos táctiles en carruseles
 * Detecta swipes horizontales y ejecuta callbacks
 *
 * @param config - Configuración del carousel táctil
 * @returns Referencia para attachar al elemento del carousel
 */
export function useTouchCarousel({
    onSwipeLeft,
    onSwipeRight,
    minSwipeDistance = 50,
}: TouchCarouselConfig) {
    // Referencia al elemento del carousel
    const containerRef = useRef<HTMLDivElement>(null)

    // Variable para rastrear el inicio del toque
    const touchStartXRef = useRef(0)
    // Variable para rastrear la posición actual del toque
    const touchCurrentXRef = useRef(0)

    useEffect(() => {
        const element = containerRef.current
        if (!element) return

        /**
         * Manejador para cuando se inicia el toque
         * Guarda la posición inicial del toque
         */
        const handleTouchStart = (e: TouchEvent) => {
            touchStartXRef.current = e.touches[0]?.clientX || 0
            touchCurrentXRef.current = touchStartXRef.current
        }

        /**
         * Manejador para cuando se mueve el dedo
         * Actualiza la posición actual del toque
         */
        const handleTouchMove = (e: TouchEvent) => {
            touchCurrentXRef.current = e.touches[0]?.clientX || 0
        }

        /**
         * Manejador para cuando se suelta el toque
         * Calcula la distancia y ejecuta el callback correspondiente
         */
        const handleTouchEnd = () => {
            const swipeDistance =
                touchStartXRef.current - touchCurrentXRef.current

            // Si el swipe es mayor a la distancia mínima
            if (Math.abs(swipeDistance) > minSwipeDistance) {
                // Si el swipe fue hacia la izquierda (distancia positiva)
                if (swipeDistance > 0) {
                    onSwipeLeft()
                }
                // Si el swipe fue hacia la derecha (distancia negativa)
                else {
                    onSwipeRight()
                }
            }
        }

        // Agregar event listeners
        element.addEventListener("touchstart", handleTouchStart, false)
        element.addEventListener("touchmove", handleTouchMove, false)
        element.addEventListener("touchend", handleTouchEnd, false)

        // Limpiar event listeners al desmontar
        return () => {
            element.removeEventListener("touchstart", handleTouchStart)
            element.removeEventListener("touchmove", handleTouchMove)
            element.removeEventListener("touchend", handleTouchEnd)
        }
    }, [onSwipeLeft, onSwipeRight, minSwipeDistance])

    return containerRef
}
