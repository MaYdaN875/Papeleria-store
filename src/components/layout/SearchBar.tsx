/**
 * Barra de búsqueda del header. Muestra sugerencias mientras se escribe; Enter navega a /all-products?search=...
 * En móvil puede mostrar placeholder distinto. Sincronizado con query de la URL en AllProducts.
 */
import { useEffect, useRef, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router"
import { useProductSearch } from "../../hooks/useProductSearch"
import type { Product } from "../../types/Product"

export interface SearchBarProps {
    products: Product[]
    placeholder?: string
}

export function SearchBar({
    products,
    placeholder = "Buscar productos, marcas...",
}: SearchBarProps) {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const urlSearchQuery = searchParams.get("search") || ""
    const [isSearchActive, setIsSearchActive] = useState(!urlSearchQuery)
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 480)
    const inputRef = useRef<HTMLInputElement>(null)

    // Detectar cambios de tamaño de pantalla
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 480)
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const {
        searchQuery,
        searchResults,
        showResults,
        searchBoxRef,
        handleSearch,
        handleResultClick,
        setShowResults,
    } = useProductSearch({ products })

    // Usar query del URL si existe, si no usar query del estado del hook
    const displayQuery = urlSearchQuery || searchQuery

    // Manejar presionar ENTER para navegar a all-products con búsqueda
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && displayQuery.trim().length > 0) {
            e.preventDefault()
            // Navegar a all-products con el término de búsqueda como query param
            navigate(`/all-products?search=${encodeURIComponent(displayQuery.trim())}`)
            // Limpiar estado del buscador
            handleResultClick()
            // Desactivar input para que no se pueda escribir hasta hacer click
            setIsSearchActive(false)
            // Quitar focus del input para que no se vea resaltado
            inputRef.current?.blur()
        }
    }

    // Limpiar búsqueda: remover query param y volver a mostrar todos los productos
    const handleClearSearch = () => {
        if (urlSearchQuery) {
            navigate("/all-products")
        }
        handleResultClick()
        // Activar input para poder escribir nuevamente
        setIsSearchActive(true)
    }

    // Activar input cuando se hace click
    const handleInputFocus = () => {
        setIsSearchActive(true)
        if (displayQuery) {
            setShowResults(true)
        }
    }

    return (
        <div className="header-search" ref={searchBoxRef}>
            <div className="search-box">
                <i className="fas fa-search" aria-hidden="true" />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder={isMobile ? "Buscar productos..." : placeholder}
                    id="searchInput"
                    value={displayQuery}
                    onChange={handleSearch}
                    onKeyDown={handleKeyDown}
                    onFocus={handleInputFocus}
                    readOnly={!isSearchActive}
                    aria-label="Buscar productos"
                />
                {/* Botón X para limpiar búsqueda en AllProducts */}
                {urlSearchQuery && (
                    <button
                        type="button"
                        className="search-clear-btn"
                        onClick={handleClearSearch}
                        aria-label="Limpiar búsqueda"
                        title="Limpiar búsqueda"
                    >
                        <i className="fas fa-times" />
                    </button>
                )}
            </div>

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

            {showResults && searchResults.length === 0 && displayQuery && (
                <div className="search-results-dropdown">
                    <div className="search-no-results">
                        <i className="fas fa-search" aria-hidden="true" />
                        <p>No se encontraron productos</p>
                    </div>
                </div>
            )}
        </div>
    )
}
