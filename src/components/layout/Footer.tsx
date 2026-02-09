export function Footer() {
    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-info-section">
                    <div className="info-column">
                        <h3>Info</h3>
                        <p>
                            God Art es la experiencia premium en la venta de artículos de papelería y útiles escolares
                            en Santa Marta. Ofrecemos una variedad de productos de calidad superior, incluyendo bolígrafos,
                            cuadernos, marcadores, papeles especiales y artículos de memorabilia. Nuestro enfoque es
                            brindar a nuestros clientes la oportunidad de encontrar todo lo que necesitan
                            para expresar su creatividad y profesionalismo.
                        </p>
                        <p style={{ marginTop: "15px" }}>
                            Además de la venta de productos, la tienda organiza eventos especiales donde los
                            clientes pueden reunirse y disfrutar de actividades interactivas. Nuestro objetivo es
                            crear un ambiente que fomente la comunidad entre los aficionados a la papelería,
                            siendo el principal destino para los entusiastas en la región.
                        </p>
                    </div>
                    <div className="map-column">
                        <h3>Encuéntranos</h3>
                        <div className="map-container">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!4v1768970660765!6m8!1m7!1syNqGKpFa8oFHb9UfeV3tOw!2m2!1d20.6722986572296!2d-103.275978625542!3f292.52!4f-6.8799999999999955!5f0.7820865974627469"
                                width="100%"
                                height="300"
                                style={{ border: 0, borderRadius: "8px" }}
                                allowFullScreen={true}
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Ubicación de PaperHub"
                            />
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© 2026 God Art. Todos los derechos reservados.</p>
                    <nav className="footer-legal-links">
                        <a href="#privacidad">Política de privacidad</a>
                        <span className="separator">|</span>
                        <a href="#terminos">Términos y condiciones</a>
                        <span className="separator">|</span>
                        <a href="#mapa">Mapa del sitio</a>
                        <span className="separator">|</span>
                        <a href="#cookies">Política de cookies</a>
                    </nav>
                </div>
            </div>
        </footer>
    )
}
