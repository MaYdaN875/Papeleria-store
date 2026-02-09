import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
import {
    FilterPanel,
    FilterState,
} from "../components/filters"
import {
    ProductCard,
    type ProductCardBadge,
} from "../components/product"
import { products } from "../data/products"
import { filterProductsBySearch } from "../hooks/useProductSearch"
import type { Product } from "../types/Product"
import { addProductToCart, syncCartCount } from "../utils/cart"

/* ================================
   COMPONENTE: AllProducts
   Página completa con todos los productos y filtros por categoría
   ================================ */

function getBrand(product: Product): string {
    return product.description.split(" ")[0] ?? ""
}

function getBadgeForProduct(product: Product): ProductCardBadge | undefined {
    const remainder = product.id % 3
    if (remainder === 1) return { type: "discount", value: "-20%" }
    if (remainder === 2) return { type: "sale", value: "HOT" }
    if (remainder === 0) return { type: "discount", value: "-15%" }
    return undefined
}

function filterProducts(productsList: Product[], filters: FilterState): Product[] {
    return productsList.filter((product) => {
        const brand = getBrand(product)

        if (filters.productos.length > 0 && !filters.productos.includes(brand)) return false
        if (filters.brands.length > 0 && !filters.brands.includes(brand)) return false
        if (filters.mayoreo && !product.mayoreo) return false
        if (filters.menudeo && !product.menudeo) return false
        if (
            product.price < filters.priceRange[0] ||
            product.price > filters.priceRange[1]
        )
            return false

        return true
    })
}

/* ================================
   Hook para detectar viewport mobile
   ================================ */
function useIsMobile(): boolean {
    const [isMobile, setIsMobile] = useState<boolean | null>(null)

    useEffect(() => {
        // Establecer el valor inicial inmediatamente
        const checkMobile = () => window.innerWidth <= 480
        setIsMobile(checkMobile())

        // Escuchar cambios de tamaño
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 480)
        }

        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    // Usar una fallback en el render inicial
    return isMobile ?? window.innerWidth <= 480
}

export const AllProducts = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const searchQuery = searchParams.get("search") || ""
    const isMobile = useIsMobile()

    const [filters, setFilters] = useState<FilterState>({
        productos: [],
        brands: [],
        mayoreo: false,
        menudeo: false,
        priceRange: [0, 1000],
    })
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
    const [isClosing, setIsClosing] = useState(false)

    const handleCloseDrawer = () => {
        setIsClosing(true)
        setTimeout(() => {
            setIsFilterDrawerOpen(false)
            setIsClosing(false)
        }, 300)
    }

    useEffect(() => {
        window.scrollTo(0, 0)
        syncCartCount()
        setIsFilterDrawerOpen(false) // Cerrar drawer al entrar a la página
    }, [])

    // Primero filtrar por búsqueda si existe, luego aplicar filtros adicionales
    const productsAfterSearch = useMemo(() => {
        if (!searchQuery) return products

        return filterProductsBySearch(products, searchQuery)
    }, [searchQuery])

    const filteredProducts = useMemo(
        () => filterProducts(productsAfterSearch, filters),
        [productsAfterSearch, filters]
    )

    const handleAddToCart = useCallback((product: Product) => {
        addProductToCart(product.name, product.price.toFixed(2))
    }, [])

    return (
        <>
            <section className="all-products-header-container">
                <div className="header-content">
                    <button className="btn-back" onClick={() => navigate("/")}>
                        <i className="fas fa-arrow-left" /> Volver
                    </button>
                    <div className="header-info">
                        <h1 className="page-title">
                            {searchQuery
                                ? `Resultados de búsqueda: "${searchQuery}"`
                                : "Todos Nuestros Productos"}
                        </h1>
                        <p className="page-subtitle">
                            {searchQuery
                                ? `Mostrando ${filteredProducts.length} resultado(s) para tu búsqueda`
                                : "Explora nuestro catálogo completo por categoría"}
                        </p>
                    </div>
                </div>
            </section>

            <section className="all-products-section">
                {/* Barra de acciones para MÓVIL SOLAMENTE */}
                {isMobile && (
                    <div className="mobile-filter-bar">
                        <button
                            className="filter-button"
                            onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
                        >
                            <i className="fas fa-filter" />
                            <span>Filtros</span>
                        </button>
                    </div>
                )}

                {/* Backdrop del drawer cuando está abierto */}
                {isMobile && isFilterDrawerOpen && (
                    <div
                        className={`filter-drawer-backdrop active ${isClosing ? "closing" : ""}`}
                        onClick={() => handleCloseDrawer()}
                    />
                )}

                <div className="products-layout-container">
                    {/* FilterPanel como drawer en móvil, sidebar en desktop */}
                    <div
                        className={`filter-panel-wrapper ${isFilterDrawerOpen && isMobile ? "drawer-open" : ""} ${isClosing ? "closing" : ""}`}
                    >
                        {/* Botón de cierre para el drawer en móvil */}
                        {isMobile && isFilterDrawerOpen && (
                            <button
                                className="filter-drawer-close-btn"
                                onClick={() => handleCloseDrawer()}
                                aria-label="Cerrar filtros"
                            >
                                <i className="fas fa-times" />
                            </button>
                        )}
                        <FilterPanel
                            onFilterChange={(newFilters) => setFilters(newFilters)}
                        />
                    </div>

                    <div className="products-content-area">
                        <div className="all-products-grid" id="allProductsGrid">
                            {filteredProducts.length === 0 ? (
                                <p className="no-products-message">
                                    No hay productos que coincidan con los
                                    filtros seleccionados.
                                </p>
                            ) : (
                                filteredProducts.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        badge={getBadgeForProduct(product)}
                                        brand={getBrand(product)}
                                        onAddToCart={() =>
                                            handleAddToCart(product)
                                        }
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}
