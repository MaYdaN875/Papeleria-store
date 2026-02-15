/** Toast temporal con mensaje; se cierra solo tras `duration` ms o por acción del usuario. */
import { useEffect } from "react"

export interface NotificationProps {
    message: string
    onClose: () => void
    duration?: number
}

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
        <div
            className="notification"
            style={{ animation: "slideInRight 0.3s ease" }}
        >
            {message}
        </div>
    )
}
