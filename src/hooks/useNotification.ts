import { useCallback, useState } from "react"

export interface UseNotificationReturn {
    /** Mensaje actual (null si no hay notificación visible) */
    message: string | null
    /** Muestra una notificación (el componente Notification maneja el auto-cierre) */
    showNotification: (msg: string) => void
    /** Cierra la notificación manualmente */
    clearNotification: () => void
}

/**
 * Hook para mostrar notificaciones temporales desde cualquier componente.
 * Usar junto con el componente <Notification /> para renderizar el mensaje.
 */
export function useNotification(): UseNotificationReturn {
    const [message, setMessage] = useState<string | null>(null)

    const showNotification = useCallback((msg: string) => {
        setMessage(msg)
    }, [])

    const clearNotification = useCallback(() => {
        setMessage(null)
    }, [])

    return {
        message,
        showNotification,
        clearNotification,
    }
}
