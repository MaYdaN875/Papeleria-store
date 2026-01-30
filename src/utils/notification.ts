/**
 * Muestra una notificación temporal en la pantalla.
 * Usa la clase CSS .notification (estilos en notifications.css).
 */
export function showNotification(message: string): void {
    const notification = document.createElement('div')
    notification.className = 'notification'
    notification.textContent = message

    document.body.appendChild(notification)

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease'
        setTimeout(() => {
            notification.remove()
        }, 300)
    }, 3000)
}
