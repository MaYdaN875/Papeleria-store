import { Link, useNavigate } from "react-router"
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
    const {
        searchQuery,
        searchResults,
        showResults,
        searchBoxRef,
        handleSearch,
        handleResultClick,
        setShowResults,
    } = useProductSearch({ products })

    // Manejar presionar ENTER para navegar a all-products con búsqueda
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && searchQuery.trim().length > 0) {
            e.preventDefault()
            // Navegar a all-products con el término de búsqueda como query param
            navigate(`/all-products?search=${encodeURIComponent(searchQuery.trim())}`)
            // Limpiar estado del buscador
            handleResultClick()
        }
    }

    return (
        <div className="header-search" ref={searchBoxRef}>
            <div className="search-box">
                <i className="fas fa-search" aria-hidden="true" />
                <input
                    type="text"
                    placeholder={placeholder}
                    id="searchInput"
                    value={searchQuery}
                    onChange={handleSearch}
                    onKeyDown={handleKeyDown}
                    onFocus={() => searchQuery && setShowResults(true)}
                    aria-label="Buscar productos"
                />
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

            {showResults && searchResults.length === 0 && searchQuery && (
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
