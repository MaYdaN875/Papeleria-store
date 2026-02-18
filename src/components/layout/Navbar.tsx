/**
 * Navbar principal: logo, buscador y acciones principales.
 * Desktop: trigger de texto "Categorías" que despliega panel al hover.
 * Mobile: mantiene menú lateral con botón de 3 líneas.
 */
import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router"
import { products } from "../../data/products"
import { useNotification } from "../../hooks/useNotification"
import { Notification } from "../ui/Notification"
import { SearchBar } from "./SearchBar"

interface NavbarCategory {
    id: string
    label: string
    icon: string
}

const CATEGORIES: NavbarCategory[] = [
    {
        id: "oficina-escolares",
        label: "Oficina y Escolares",
        icon: "fas fa-briefcase",
    },
    {
        id: "arte-manualidades",
        label: "Arte y Manualidades",
        icon: "fas fa-palette",
    },
    {
        id: "mitril-regalos",
        label: "Mitril y Regalos",
        icon: "fas fa-gift",
    },
    {
        id: "servicios-digitales-impresiones",
        label: "Servicios Digitales e Impresiones",
        icon: "fas fa-print",
    },
]

export function Navbar() {
    const { message, showNotification, clearNotification } = useNotification()
    const navigate = useNavigate()
    const location = useLocation()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isMenuClosing, setIsMenuClosing] = useState(false)
    const [isDesktopCategoriesOpen, setIsDesktopCategoriesOpen] = useState(false)
    const desktopCloseTimeoutRef = useRef<number | null>(null)
    const preventDesktopOpenUntilRef = useRef(0)

    const handleContactClick = useCallback(() => {
        showNotification("¡Nos pondremos en contacto pronto!")
    }, [showNotification])

    const handleLogoClick = useCallback(
        (e: React.MouseEvent<HTMLAnchorElement>) => {
            e.preventDefault()
            if (location.pathname === "/") {
                // Si ya estamos en la página principal, scroll hasta arriba
                window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                })
            } else {
                // Si no estamos en la página principal, navega al inicio
                navigate("/")
            }
        },
        [location.pathname, navigate]
    )

    const handleCategoryClick = (categoryId: string) => {
        if (isMobileMenuOpen) closeMenu()
        if (desktopCloseTimeoutRef.current !== null) {
            globalThis.clearTimeout(desktopCloseTimeoutRef.current)
            desktopCloseTimeoutRef.current = null
        }
        preventDesktopOpenUntilRef.current = Date.now() + 500
        setIsDesktopCategoriesOpen(false)
        navigate(`/all-products?category=${categoryId}`)
    }

    const openDesktopCategories = () => {
        if (Date.now() < preventDesktopOpenUntilRef.current) return

        if (desktopCloseTimeoutRef.current !== null) {
            globalThis.clearTimeout(desktopCloseTimeoutRef.current)
            desktopCloseTimeoutRef.current = null
        }
        setIsDesktopCategoriesOpen(true)
    }

    const closeDesktopCategoriesWithDelay = () => {
        if (desktopCloseTimeoutRef.current !== null) {
            globalThis.clearTimeout(desktopCloseTimeoutRef.current)
        }

        desktopCloseTimeoutRef.current = globalThis.setTimeout(() => {
            setIsDesktopCategoriesOpen(false)
            desktopCloseTimeoutRef.current = null
        }, 320)
    }

    useEffect(() => {
        return () => {
            if (desktopCloseTimeoutRef.current !== null) {
                globalThis.clearTimeout(desktopCloseTimeoutRef.current)
            }
        }
    }, [])

    useEffect(() => {
        if (desktopCloseTimeoutRef.current !== null) {
            globalThis.clearTimeout(desktopCloseTimeoutRef.current)
            desktopCloseTimeoutRef.current = null
        }
        preventDesktopOpenUntilRef.current = Date.now() + 250
        setIsDesktopCategoriesOpen(false)
    }, [location.pathname, location.search])

    useEffect(() => {
        if (!isDesktopCategoriesOpen) return

        const handleScrollClose = () => {
            setIsDesktopCategoriesOpen(false)
            if (desktopCloseTimeoutRef.current !== null) {
                globalThis.clearTimeout(desktopCloseTimeoutRef.current)
                desktopCloseTimeoutRef.current = null
            }
        }

        globalThis.window?.addEventListener("scroll", handleScrollClose, { passive: true })
        return () => {
            globalThis.window?.removeEventListener("scroll", handleScrollClose)
        }
    }, [isDesktopCategoriesOpen])

    const closeMenu = () => {
        setIsMenuClosing(true)
        setTimeout(() => {
            setIsMobileMenuOpen(false)
            setIsMenuClosing(false)
        }, 500)
    }

    return (
        <>
            {message && (
                <Notification
                    message={message}
                    onClose={clearNotification}
                    duration={3000}
                />
            )}
            <header className="header">
                <div className="header-container">
                    <div className="header-left">
                        <Link
                            to="/"
                            className="header-logo"
                            onClick={handleLogoClick}
                        >
                            <div className="logo-icon">🎨</div>
                            <h1>God Art</h1>
                        </Link>
                    </div>

                    <SearchBar
                        products={products}
                        placeholder="Buscar productos, marcas..."
                    />

                    <div className="header-right">
                        <div
                            className={`desktop-categories-wrapper ${isDesktopCategoriesOpen ? "is-open" : ""}`}
                        >
                            <button
                                type="button"
                                className="desktop-categories-trigger"
                                onClick={() =>
                                    setIsDesktopCategoriesOpen(
                                        (isOpen) => !isOpen
                                    )
                                }
                                onMouseEnter={openDesktopCategories}
                                onMouseLeave={closeDesktopCategoriesWithDelay}
                                aria-label="Mostrar categorías"
                                aria-expanded={isDesktopCategoriesOpen}
                                aria-haspopup="menu"
                            >
                                <span>Categorías</span>
                                <i
                                    className="fas fa-chevron-down"
                                    aria-hidden="true"
                                />
                            </button>
                            <div
                                className="desktop-categories-menu"
                                onMouseEnter={openDesktopCategories}
                                onMouseLeave={closeDesktopCategoriesWithDelay}
                                onKeyDown={(event) => {
                                    if (event.key === "Escape") {
                                        setIsDesktopCategoriesOpen(false)
                                    }
                                }}
                                tabIndex={-1}
                                role="menu"
                                aria-label="Categorías de productos"
                            >
                                <p className="desktop-categories-title">
                                    Explorar categorías
                                </p>
                                <div className="desktop-categories-grid">
                                    {CATEGORIES.map((category) => (
                                        <button
                                            key={category.id}
                                            type="button"
                                            className="desktop-category-item"
                                            onClick={() =>
                                                handleCategoryClick(
                                                    category.id
                                                )
                                            }
                                        >
                                            <i
                                                className={category.icon}
                                                aria-hidden="true"
                                            />
                                            <span>{category.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="btn-categories"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label="Abrir menú de categorías"
                            aria-expanded={isMobileMenuOpen}
                            title="Categorías"
                        >
                            <i className="fas fa-bars" aria-hidden="true" />
                        </button>
                        <Link
                            to="/login"
                            className="btn-login"
                            aria-label="Iniciar sesión"
                        >
                            <span className="btn-login-icon">
                                <i className="fas fa-user" aria-hidden="true" />
                            </span>
                            <span className="btn-login-text">Iniciar Sesión</span>
                        </Link>
                        <button
                            type="button"
                            className="btn-cta"
                            onClick={handleContactClick}
                        >
                            Contactar
                        </button>
                        <Link
                            to="/cart"
                            className="cart-icon"
                            aria-label="Ver carrito"
                        >
                            <i className="fas fa-shopping-cart" aria-hidden />
                            <span className="cart-count" id="cartCount">
                                0
                            </span>
                        </Link>
                    </div>
                </div>

                {/* Menú deslizable en móvil */}
                {isMobileMenuOpen && (
                    <>
                        <button
                            type="button"
                            className={`mobile-menu-backdrop ${isMenuClosing ? "closing" : ""}`}
                            onClick={() => closeMenu()}
                            aria-label="Cerrar menú de categorías"
                        />
                        <div className={`mobile-menu ${isMenuClosing ? "closing" : ""}`}>
                            <div className={`mobile-menu-header ${isMenuClosing ? "closing" : ""}`}>
                                <h2>Categorías</h2>
                                <button
                                    type="button"
                                    className="close-menu-btn"
                                    onClick={() => closeMenu()}
                                    aria-label="Cerrar menú"
                                >
                                    <i className="fas fa-times" aria-hidden />
                                </button>
                            </div>
                            <div className="mobile-menu-categories">
                                {CATEGORIES.map((category) => (
                                    <button
                                        key={category.id}
                                        type="button"
                                        className={`mobile-category-btn ${isMenuClosing ? "closing" : ""}`}
                                        onClick={() =>
                                            handleCategoryClick(category.id)
                                        }
                                    >
                                        <i
                                            className={category.icon}
                                            aria-hidden
                                        />
                                        <span>{category.label}</span>
                                        <i
                                            className="fas fa-chevron-right"
                                            aria-hidden
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </header>
        </>
    )
}
