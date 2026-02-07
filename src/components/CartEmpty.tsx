import { Link } from "react-router"

/**
 * Estado vacío del carrito: mensaje, imagen y link para volver.
 */
export function CartEmpty() {
    return (
        <div className="cart-empty-container">
            <h2>Mi Carrito</h2>
            <div className="empty-message">
                <p>Tu Carrito Está Vacío</p>
                <p>
                    Tenemos Grandes Ofertas Que Podrían Interesarte. ¡Elige Lo
                    Que Necesitas!
                </p>
            </div>
            <div className="empty-cart-icon">
                <img
                    src="images/carrito.png"
                    alt="Carrito vacío"
                    style={{
                        width: 300,
                        height: 300,
                        margin: "0 auto",
                        display: "block",
                    }}
                />
            </div>
            <p className="nothing-here">Nada aquí</p>
            <Link to="/" className="btn-return">
                Volver a la tienda
            </Link>
        </div>
    )
}
