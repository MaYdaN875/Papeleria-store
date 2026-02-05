import { Link } from "react-router"
import type { Product } from "../types/Product"
import { useProductSearch } from "../hooks/useProductSearch"

export interface SearchBarProps {
    /** Lista de productos donde buscar */
    products: Product[]
    /** Placeholder del input */
    placeholder?: string
}

/**
 * Barra de búsqueda con dropdown de resultados.
 * Usa useProductSearch para la lógica de filtrado y estado.
 */
export function SearchBar({
    products,
    placeholder = "Buscar productos, marcas...",
}: SearchBarProps) {
    const {
        searchQuery,
        searchResults,
        showResults,
        searchBoxRef,
        handleSearch,
        handleResultClick,
        setShowResults,
    } = useProductSearch({ products })

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
