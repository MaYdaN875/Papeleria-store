import { useCallback, useEffect, useRef, useState } from "react"
import { Link } from "react-router"
import { products } from "../data/products"
import { Product } from "../types/Product"
import { smoothScroll } from "../utils/SmoothScroll"

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
                        <div className="logo-icon">📚</div>
                        <h1>PaperHub</h1>
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
                {/* Menú horizontal con las 4 categorías principales */}
                <nav className="navbar" aria-label="Categorías de productos">
                    <div className="navbar-container">
                        <button type="button" className="category-link">
                            <i className="fas fa-book" aria-hidden="true" /> Útiles Escolares
                        </button>
                        <button type="button" className="category-link">
                            <i className="fas fa-pencil-alt" aria-hidden="true" /> Escritura
                        </button>
                        <button type="button" className="category-link">
                            <i className="fas fa-file" aria-hidden="true" /> Papelería
                        </button>
                        <button type="button" className="category-link">
                            <i className="fas fa-palette" aria-hidden="true" /> Arte & Manualidades
                        </button>
                    </div>
                </nav>
            </header>
        </>
    )
}
