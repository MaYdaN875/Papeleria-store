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
import { products as staticProducts } from "../data/products"
import { filterProductsBySearch } from "../hooks/useProductSearch"
import { fetchStoreProducts } from "../services/storeApi"
import type { Product } from "../types/Product"
import { addProductToCart, syncCartCount } from "../utils/cart"

const DEFAULT_MAX_PRICE_FILTER = 100000
const ALL_PRODUCTS_SKELETON_IDS = [
    "skeleton-1",
    "skeleton-2",
    "skeleton-3",
    "skeleton-4",
    "skeleton-5",
    "skeleton-6",
    "skeleton-7",
    "skeleton-8",
    "skeleton-9",
    "skeleton-10",
] as const

/**
 * Página "Todos los productos".
 * Muestra grid de productos con filtros (categoría, marcas, precio, mayoreo/menudeo),
 * búsqueda por URL (?search=) y vista adaptada a móvil (drawer de filtros).
 */

function getBrand(product: Product): string {
    return product.description.split(" ")[0] ?? ""
}

function getBadgeForProduct(product: Product): ProductCardBadge | undefined {
    if (!product.originalPrice || product.originalPrice <= product.price) return undefined

    const discountPercent = product.discountPercentage ??
        Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)

    if (discountPercent <= 0) return undefined

    return { type: "discount", value: `-${discountPercent}%` }
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

/** Detecta si el viewport es móvil (≤480px) para mostrar filtros en drawer. */
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
        priceRange: [0, DEFAULT_MAX_PRICE_FILTER],
    })
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
    const [isClosing, setIsClosing] = useState(false)
    const [storeProducts, setStoreProducts] = useState<Product[]>([])
    const [shouldUseStaticFallback, setShouldUseStaticFallback] = useState(false)
    const [isLoadingProducts, setIsLoadingProducts] = useState(true)
    const [productsLoadError, setProductsLoadError] = useState("")

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
        async function loadStoreProducts() {
            setIsLoadingProducts(true)
            setProductsLoadError("")

            try {
                const result = await fetchStoreProducts()
                if (!result.ok || !result.products) {
                    setProductsLoadError(result.message ?? "No se pudo cargar catálogo desde la API.")
                    setStoreProducts([])
                    setShouldUseStaticFallback(true)
                    setIsLoadingProducts(false)
                    return
                }

                setStoreProducts(result.products)
                setShouldUseStaticFallback(false)
                setIsLoadingProducts(false)
            } catch (loadError) {
                console.error(loadError)
                setProductsLoadError("No se pudo conectar con la API. Se muestra catálogo local.")
                setStoreProducts([])
                setShouldUseStaticFallback(true)
                setIsLoadingProducts(false)
            }
        }

        void loadStoreProducts()
    }, [])

    const baseProducts = shouldUseStaticFallback ? staticProducts : storeProducts

    // Primero filtrar por búsqueda si existe, luego aplicar filtros adicionales
    const productsAfterSearch = useMemo(() => {
        if (!searchQuery) return baseProducts

        return filterProductsBySearch(baseProducts, searchQuery)
    }, [baseProducts, searchQuery])

    const filteredProducts = useMemo(
        () => filterProducts(productsAfterSearch, filters),
        [productsAfterSearch, filters]
    )
    const hasNoFilteredProducts = !isLoadingProducts && filteredProducts.length === 0

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
                    <button
                        type="button"
                        className={`filter-drawer-backdrop active ${isClosing ? "closing" : ""}`}
                        onClick={() => handleCloseDrawer()}
                        aria-label="Cerrar panel de filtros"
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
                        {isLoadingProducts && (
                            <p className="no-products-message">
                                Cargando catálogo desde la base de datos...
                            </p>
                        )}
                        {!isLoadingProducts && productsLoadError && (
                            <p className="no-products-message">{productsLoadError}</p>
                        )}
                        <div className="all-products-grid" id="allProductsGrid">
                            {isLoadingProducts && ALL_PRODUCTS_SKELETON_IDS.map((skeletonId) => (
                                <article key={skeletonId} className="product-card-skeleton">
                                    <div className="product-card-skeleton-image product-skeleton-shimmer" />
                                    <div className="product-card-skeleton-content">
                                        <div className="product-card-skeleton-line product-skeleton-shimmer" />
                                        <div className="product-card-skeleton-line product-card-skeleton-line--short product-skeleton-shimmer" />
                                        <div className="product-card-skeleton-price product-skeleton-shimmer" />
                                        <div className="product-card-skeleton-button product-skeleton-shimmer" />
                                    </div>
                                </article>
                            ))}
                            {hasNoFilteredProducts && (
                                <p className="no-products-message">
                                    No hay productos que coincidan con los
                                    filtros seleccionados.
                                </p>
                            )}
                            {!isLoadingProducts && filteredProducts.length > 0 && (
                                filteredProducts.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        badge={getBadgeForProduct(product)}
                                        originalPrice={product.originalPrice}
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
