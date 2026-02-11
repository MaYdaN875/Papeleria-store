import { Link, useLocation } from "react-router"

/* ================================
   COMPONENTE: MobileBottomNav
   Navbar inferior para dispositivos móviles
   Estilo Mercado Libre/Amazon con iconos y etiquetas
   ================================ */

export function MobileBottomNav() {
    const location = useLocation()

    // Función para validar si está en ruta activa
    const isActive = (path: string): boolean => {
        if (path === "/" && location.pathname === "/") return true
        if (path !== "/" && location.pathname.startsWith(path)) return true
        return false
    }

    return (
        <nav className="mobile-bottom-nav" aria-label="Navegación principal móvil">
            <div className="mobile-bottom-nav__container">
                {/* Opción: Inicio */}
                <Link
                    to="/"
                    className={`mobile-bottom-nav__item ${isActive("/") ? "mobile-bottom-nav__item--active" : ""}`}
                    aria-label="Ir a inicio"
                    title="Inicio"
                >
                    <i className="fas fa-home" aria-hidden="true" />
                    <span className="mobile-bottom-nav__label">Inicio</span>
                </Link>

                {/* Opción: Productos */}
                <Link
                    to="/all-products"
                    className={`mobile-bottom-nav__item ${isActive("/all-products") ? "mobile-bottom-nav__item--active" : ""}`}
                    aria-label="Ver todos los productos"
                    title="Productos"
                >
                    <i className="fas fa-th-large" aria-hidden="true" />
                    <span className="mobile-bottom-nav__label">Productos</span>
                </Link>

                {/* Opción: Cuenta */}
                <Link
                    to="/login"
                    className={`mobile-bottom-nav__item ${isActive("/login") ? "mobile-bottom-nav__item--active" : ""}`}
                    aria-label="Ir a mi cuenta"
                    title="Cuenta"
                >
                    <i className="fas fa-user" aria-hidden="true" />
                    <span className="mobile-bottom-nav__label">Cuenta</span>
                </Link>

                {/* Opción: Carrito */}
                <Link
                    to="/cart"
                    className={`mobile-bottom-nav__item mobile-bottom-nav__item--cart ${isActive("/cart") ? "mobile-bottom-nav__item--active" : ""}`}
                    aria-label="Ver carrito de compras"
                    title="Carrito"
                >
                    <i className="fas fa-shopping-cart" aria-hidden="true" />
                    <span className="mobile-bottom-nav__badge" id="mobileCartCount">
                        0
                    </span>
                    <span className="mobile-bottom-nav__label">Carrito</span>
                </Link>
            </div>
        </nav>
    )
}
