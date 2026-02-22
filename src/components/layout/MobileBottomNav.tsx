/**
 * Barra de navegación inferior en móvil: Inicio, Productos, Cuenta, Carrito.
 * Solo visible en viewports pequeños; resalta la ruta activa.
 */
import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router"
import {
    getStoreAuthChangedEventName,
    getStoreUser,
} from "../../utils/storeSession"

function buildMobileUserLabel(fullName: string): string {
    const name = fullName.trim()
    if (!name) return "Cuenta"
    if (name.length <= 10) return name
    const firstName = name.split(/\s+/)[0] ?? name
    return firstName.length <= 10 ? firstName : `${firstName.slice(0, 8)}…`
}

export function MobileBottomNav() {
    const location = useLocation()
    const [storeUserName, setStoreUserName] = useState("")

    useEffect(() => {
        const refreshStoreUser = () => {
            const currentUser = getStoreUser()
            setStoreUserName(currentUser?.name ?? "")
        }

        refreshStoreUser()
        globalThis.addEventListener("storage", refreshStoreUser)
        globalThis.addEventListener(getStoreAuthChangedEventName(), refreshStoreUser)

        return () => {
            globalThis.removeEventListener("storage", refreshStoreUser)
            globalThis.removeEventListener(getStoreAuthChangedEventName(), refreshStoreUser)
        }
    }, [])

    const accountLabel = buildMobileUserLabel(storeUserName)

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
                    title={storeUserName.trim() || "Cuenta"}
                >
                    <i className="fas fa-user" aria-hidden="true" />
                    <span className="mobile-bottom-nav__label">{accountLabel}</span>
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

