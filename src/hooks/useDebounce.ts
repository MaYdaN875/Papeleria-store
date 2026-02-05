import { useEffect, useState } from "react"

/**
 * Retorna un valor debounced: se actualiza tras `delay` ms de inactividad.
 * Útil para no ejecutar búsquedas en cada keystroke.
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value)

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay)
        return () => clearTimeout(timer)
    }, [value, delay])

    return debouncedValue
}
