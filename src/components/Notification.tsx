import { useEffect } from "react"

export interface NotificationProps {
    /** Mensaje a mostrar */
    message: string
    /** Callback al cerrar (manual o por timeout) */
    onClose: () => void
    /** Duración en ms antes de auto-cerrar (default: 3000) */
    duration?: number
}

/**
 * Notificación temporal que se auto-cierra tras `duration` ms.
 * Usa la clase CSS .notification (estilos en notifications.css).
 */
export function Notification({
    message,
    onClose,
    duration = 3000,
}: NotificationProps) {
    useEffect(() => {
        const timer = setTimeout(onClose, duration)
        return () => clearTimeout(timer)
    }, [onClose, duration])

    return (
        <div className="notification" style={{ animation: "slideInRight 0.3s ease" }}>
            {message}
        </div>
    )
}
