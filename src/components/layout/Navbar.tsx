import { useCallback } from "react"
import { Link } from "react-router"
import { products } from "../../data/products"
import { useNotification } from "../../hooks/useNotification"
import { smoothScroll } from "../../utils/SmoothScroll"
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

    const handleContactClick = useCallback(() => {
        showNotification("¡Nos pondremos en contacto pronto!")
    }, [showNotification])

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
                        onClick={() => smoothScroll("inicio")}
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
                        {CATEGORIES.map((category) => (
                            <CategoryDropdown
                                key={category.id}
                                category={category}
                            />
                        ))}
                    </div>
                </nav>
            </header>
        </>
    )
}
