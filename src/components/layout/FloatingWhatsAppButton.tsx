/** Botón flotante que abre WhatsApp (wa.me) en nueva pestaña. */
export function FloatingWhatsAppButton() {
    return (
        <a
            href="https://wa.me/3318686645"
            className="whatsapp-btn"
            target="_blank"
            rel="noreferrer"
            title="Contáctanos por WhatsApp"
        >
            <i className="fab fa-whatsapp" />
        </a>
    )
}
