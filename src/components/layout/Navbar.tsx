import { useCallback, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router"
import { products } from "../../data/products"
import { useNotification } from "../../hooks/useNotification"
import {
    CategoryDropdown,
    type CategoryDropdownCategory,
} from "../filters/CategoryDropdown"
import { Notification } from "../ui/Notification"
import { SearchBar } from "./SearchBar"

const CATEGORIES: CategoryDropdownCategory[] = [
    {
        id: "escolares",
        label: "Útiles Escolares",
        icon: "fas fa-book",
        items: [
            { name: "Cuadernos", icon: "fas fa-book", color: "#FF6B9D" },
            { name: "Estuches", icon: "fas fa-briefcase", color: "#C44569" },
            { name: "Gomas", icon: "fas fa-eraser", color: "#F7CE5B" },
            { name: "Mochilas", icon: "fas fa-backpack", color: "#1A535C" },
        ],
    },
    {
        id: "escritura",
        label: "Escritura",
        icon: "fas fa-pencil-alt",
        items: [
            { name: "Bolígrafos", icon: "fas fa-pen", color: "#4ECDC4" },
            { name: "Lápices", icon: "fas fa-pencil", color: "#FFE66D" },
            { name: "Marcadores", icon: "fas fa-marker", color: "#FF6B6B" },
            { name: "Rotuladores", icon: "fas fa-highlighter", color: "#95E1D3" },
        ],
    },
    {
        id: "papeleria",
        label: "Papelería",
        icon: "fas fa-file",
        items: [
            { name: "Papel", icon: "fas fa-file", color: "#0099FF" },
            { name: "Carpetas", icon: "fas fa-folder", color: "#00CC88" },
            { name: "Sobres", icon: "fas fa-envelope", color: "#FF3366" },
            { name: "Post-it", icon: "fas fa-sticky-note", color: "#FFB900" },
        ],
    },
    {
        id: "arte",
        label: "Arte & Manualidades",
        icon: "fas fa-palette",
        items: [
            { name: "Lápices de Colores", icon: "fas fa-palette", color: "#FF006E" },
            { name: "Pinturas", icon: "fas fa-paint-brush", color: "#FFBE0B" },
            { name: "Lienzos", icon: "fas fa-image", color: "#FB5607" },
            { name: "Materiales", icon: "fas fa-toolbox", color: "#8338EC" },
        ],
    },
]

export function Navbar() {
    const { message, showNotification, clearNotification } = useNotification()
    const navigate = useNavigate()
    const location = useLocation()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isMenuClosing, setIsMenuClosing] = useState(false)

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
        closeMenu()
        navigate(`/all-products?category=${categoryId}`)
    }

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
                    <Link
                        to="/"
                        className="header-logo"
                        onClick={handleLogoClick}
                    >
                        <div className="logo-icon">🎨</div>
                        <h1>God Art</h1>
                    </Link>

                    <SearchBar
                        products={products}
                        placeholder="Buscar productos, marcas..."
                    />

                    <div className="header-right">
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

                <nav className="navbar" aria-label="Categorías de productos">
                    <div className="navbar-container">
                        {/* Categorías en desktop, ocultas en móvil */}
                        <div className="navbar-categories">
                            {CATEGORIES.map((category) => (
                                <CategoryDropdown
                                    key={category.id}
                                    category={category}
                                />
                            ))}
                        </div>
                    </div>
                </nav>

                {/* Menú deslizable en móvil */}
                {isMobileMenuOpen && (
                    <>
                        <div
                            className={`mobile-menu-backdrop ${isMenuClosing ? "closing" : ""}`}
                            onClick={() => closeMenu()}
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
