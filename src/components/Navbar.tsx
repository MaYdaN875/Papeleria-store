import { useCallback, useEffect, useRef, useState } from "react"
import { Link } from "react-router"
import { products } from "../data/products"
import { Product } from "../types/Product"
import { smoothScroll } from "../utils/SmoothScroll"
import { CategoryDropdown, CategoryDropdownCategory } from "./CategoryDropdown"

// Componente de notificación usando React
interface NotificationProps {
    message: string
    onClose: () => void
}

const Notification: React.FC<NotificationProps> = ({ message, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose()
        }, 3000)

        return () => clearTimeout(timer)
    }, [onClose])

    return (
        <div className="notification" style={{ animation: 'slideInRight 0.3s ease' }}>
            {message}
        </div>
    )
}

export const Navbar: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [searchResults, setSearchResults] = useState<Product[]>([])
    const [showResults, setShowResults] = useState<boolean>(false)
    const [notification, setNotification] = useState<string | null>(null)
    const searchBoxRef = useRef<HTMLDivElement>(null)

    // Definir las categorías con sus subcategorías
    const categories: CategoryDropdownCategory[] = [
        {
            id: "escolares",
            label: "Útiles Escolares",
            icon: "fas fa-book",
            items: [
                { name: "Cuadernos", icon: "fas fa-book", color: "#FF6B9D" },
                { name: "Estuches", icon: "fas fa-briefcase", color: "#C44569" },
                { name: "Gomas", icon: "fas fa-eraser", color: "#F7CE5B" },
                { name: "Mochilas", icon: "fas fa-backpack", color: "#1A535C" },
            ]
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
            ]
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
            ]
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
            ]
        }
    ]

    // Búsqueda de productos con useCallback para optimización
    const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value.toLowerCase().trim()
        setSearchQuery(e.target.value)

        if (query.length > 0) {
            const filtered = products.filter((product: Product) =>
                product.name.toLowerCase().includes(query) ||
                product.category.toLowerCase().includes(query) ||
                product.description.toLowerCase().includes(query)
            )
            setSearchResults(filtered)
            setShowResults(true)
        } else {
            setSearchResults([])
            setShowResults(false)
        }
    }, [])

    const handleResultClick = useCallback(() => {
        setSearchQuery("")
        setSearchResults([])
        setShowResults(false)
    }, [])

    const showNotification = useCallback((message: string) => {
        setNotification(message)
        // Auto-cerrar después de 3 segundos
        setTimeout(() => {
            setNotification(null)
        }, 3000)
    }, [])

    const handleContactClick = useCallback(() => {
        showNotification('¡Nos pondremos en contacto pronto!')
    }, [showNotification])

    // Cerrar dropdown al hacer clic fuera usando useRef
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                searchBoxRef.current &&
                !searchBoxRef.current.contains(e.target as Node)
            ) {
                setShowResults(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    return (
        <>
            {notification && (
                <Notification
                    message={notification}
                    onClose={() => setNotification(null)}
                />
            )}
            <header className="header">
                <div className="header-container">
                    {/* Logo de la papelería a la izquierda */}
                    <Link
                        to="/"
                        className="header-logo"
                        onClick={() => smoothScroll('inicio')}
                    >
                        <div className="logo-icon">🎨</div>
                        <h1>God Art</h1>
                    </Link>

                    {/* Buscador de productos en el centro del header */}
                    <div className="header-search" ref={searchBoxRef}>
                        <div className="search-box">
                            <i className="fas fa-search" aria-hidden="true" />
                            <input
                                type="text"
                                placeholder="Buscar productos, marcas..."
                                id="searchInput"
                                value={searchQuery}
                                onChange={handleSearch}
                                onFocus={() => searchQuery && setShowResults(true)}
                                aria-label="Buscar productos"
                            />
                        </div>

                        {/* Dropdown de resultados de búsqueda */}
                        {showResults && searchResults.length > 0 && (
                            <div className="search-results-dropdown" role="listbox">
                                {searchResults.map((product) => (
                                    <Link
                                        key={product.id}
                                        to={`/product/${product.id}`}
                                        className="search-result-item"
                                        onClick={handleResultClick}
                                        role="option"
                                    >
                                        <div className="result-name">{product.name}</div>
                                        <div className="result-category">{product.category}</div>
                                        <div className="result-price">${product.price}</div>
                                    </Link>
                                ))}
                            </div>
                        )}

                        {/* Mensaje cuando no hay resultados */}
                        {showResults && searchResults.length === 0 && searchQuery && (
                            <div className="search-results-dropdown">
                                <div className="search-no-results">
                                    <i className="fas fa-search" aria-hidden="true" />
                                    <p>No se encontraron productos</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sección derecha: botón llamar a la locación, contacto y carrito */}
                    <div className="header-right">
                        {/* Botón "Contactar" */}
                        <button
                            type="button"
                            className="btn-cta"
                            onClick={handleContactClick}
                        >
                            Contactar
                        </button>

                        {/* Icono del carrito que lleva a la página de carrito */}
                        <Link to="/cart" className="cart-icon" aria-label="Ver carrito">
                            <i className="fas fa-shopping-cart" aria-hidden="true" />
                            <span className="cart-count" id="cartCount">0</span>
                        </Link>
                    </div>
                </div>

                {/* NAVEGACIÓN DE CATEGORÍAS ============ */}
                {/* Menú horizontal con las 4 categorías principales con dropdown */}
                <nav className="navbar" aria-label="Categorías de productos">
                    <div className="navbar-container">
                        {categories.map((category) => (
                            <CategoryDropdown key={category.id} category={category} />
                        ))}
                    </div>
                </nav>
            </header>
        </>
    )
}
