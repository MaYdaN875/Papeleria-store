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

        // Usar el precio correspondiente al modo activo para el filtro de rango
        const activePrice = filters.mayoreo && product.mayoreoPrice != null
            ? product.mayoreoPrice
            : filters.menudeo && product.menudeoPrice != null
                ? product.menudeoPrice
                : product.price

        if (activePrice < filters.priceRange[0] || activePrice > filters.priceRange[1]) return false

        return true
    })
}

/** Transforma productos para mostrar precio/stock de mayoreo o menudeo según el filtro activo. */
function applyPriceMode(products: Product[], filters: FilterState): Product[] {
    if (!filters.mayoreo && !filters.menudeo) return products

    return products.map((product) => {
        if (filters.mayoreo && product.mayoreo && product.mayoreoPrice != null) {
            return {
                ...product,
                price: product.mayoreoPrice,
                stock: product.mayoreoStock ?? product.stock,
            }
        }
        if (filters.menudeo && product.menudeo && product.menudeoPrice != null) {
            return {
                ...product,
                price: product.menudeoPrice,
                stock: product.menudeoStock ?? product.stock,
            }
        }
        return product
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
    const pageFromUrl = Number.parseInt(searchParams.get("page") || "1", 10)
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

    // Resetear filtros al montar el componente para asegurar que se muestren todos los productos
    useEffect(() => {
        setFilters({
            productos: [],
            brands: [],
            mayoreo: false,
            menudeo: false,
            priceRange: [0, DEFAULT_MAX_PRICE_FILTER],
        })
    }, [])

    const handleCloseDrawer = () => {
        setIsClosing(true)
        setTimeout(() => {
            setIsFilterDrawerOpen(false)
            setIsClosing(false)
        }, 300)
    }

    // Resetear paginación solo cuando cambia la búsqueda
    useEffect(() => {
        window.scrollTo(0, 0)
        syncCartCount()
        setIsFilterDrawerOpen(false)
    }, [searchQuery])

    // Cargar productos al montar el componente
    useEffect(() => {
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

        // Refrescar productos al volver al foco de la pestaña
        function handleVisibilityChange() {
            if (document.visibilityState === "visible") {
                void loadStoreProducts()
            }
        }

        document.addEventListener("visibilitychange", handleVisibilityChange)
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange)
        }
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

    // Aplicar transformación de precios según filtro mayoreo/menudeo
    const displayProducts = useMemo(
        () => applyPriceMode(filteredProducts, filters),
        [filteredProducts, filters]
    )
    const hasNoFilteredProducts = !isLoadingProducts && displayProducts.length === 0

    const activeMode = filters.mayoreo ? "mayoreo" : filters.menudeo ? "menudeo" : null

    // Calcular items por página según dispositivo
    const itemsPerPage = isMobile ? 20 : 25
    const totalPages = Math.ceil(displayProducts.length / itemsPerPage)
    
    // Validar página actual - mantener la página solicitada mientras se cargan productos
    const validCurrentPage = totalPages > 0 ? Math.min(pageFromUrl, totalPages) : pageFromUrl
    
    // Calcular índices de inicio y fin
    const startIndex = (validCurrentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    
    // Productos a mostrar en la página actual
    const paginatedProducts = displayProducts.slice(startIndex, endIndex)

    // Calcular números de página a mostrar (máximo 5)
    const getPaginationNumbers = () => {
        const pages: (number | string)[] = []
        const maxButtons = 5
        
        if (totalPages <= maxButtons) {
            // Si hay 5 o menos páginas, mostrar todas
            return Array.from({ length: totalPages }, (_, i) => i + 1)
        }

        // Mostrar primeras 3 páginas
        pages.push(1, 2, 3)

        // Agregar puntos suspensivos si la página actual está lejos
        if (validCurrentPage > 4) {
            pages.push("...")
        }

        // Agregar página actual si no está en las primeras 3
        if (validCurrentPage > 4 && validCurrentPage < totalPages - 2) {
            pages.push(validCurrentPage)
        }

        // Agregar puntos suspensivos antes de la última página si es necesario
        if (validCurrentPage < totalPages - 3) {
            pages.push("...")
        }

        // Siempre mostrar última página
        if (!pages.includes(totalPages)) {
            pages.push(totalPages)
        }

        return pages
    }

    const handlePageChange = (newPage: number) => {
        // Actualizar la URL con el número de página
        const params = new URLSearchParams(searchParams)
        params.set("page", String(newPage))
        navigate(`/all-products?${params.toString()}`, { replace: true })
        // Scroll suave hacia el grid
        setTimeout(() => {
            const gridElement = document.getElementById("allProductsGrid")
            if (gridElement) {
                gridElement.scrollIntoView({ behavior: "smooth", block: "start" })
            }
        }, 0)
    }

    const handleAddToCart = useCallback((product: Product) => {
        addProductToCart(product.name, product.price.toFixed(2), 1, product.id)
    }, [])

    const handleNavigateToProduct = useCallback((productId: number) => {
        const params = new URLSearchParams()
        params.append("page", String(pageFromUrl))
        if (activeMode) {
            params.append("mode", activeMode)
        }
        navigate(`/product/${productId}?${params.toString()}`)
    }, [navigate, activeMode, pageFromUrl])

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
                                Cargando productos...
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
                            {!isLoadingProducts && displayProducts.length > 0 && (
                                paginatedProducts.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        badge={
                                            activeMode === "mayoreo"
                                                ? { type: "sale", value: "Mayoreo" }
                                                : activeMode === "menudeo"
                                                    ? { type: "sale", value: "Menudeo" }
                                                    : getBadgeForProduct(product)
                                        }
                                        originalPrice={
                                            activeMode ? undefined : product.originalPrice
                                        }
                                        brand={getBrand(product)}
                                        onAddToCart={() =>
                                            handleAddToCart(product)
                                        }
                                        onNavigate={() =>
                                            handleNavigateToProduct(product.id)
                                        }
                                    />
                                ))
                            )}
                        </div>

                        {/* Controles de paginación */}
                        {!isLoadingProducts && displayProducts.length > itemsPerPage && (
                            <div className="pagination-container">
                                <button
                                    className="pagination-btn pagination-prev"
                                    onClick={() => validCurrentPage > 1 && handlePageChange(validCurrentPage - 1)}
                                    disabled={validCurrentPage === 1}
                                    aria-label="Página anterior"
                                >
                                    <i className="fas fa-chevron-left" />
                                </button>

                                <div className="pagination-numbers">
                                    {getPaginationNumbers().map((page, index) => (
                                        page === "..." ? (
                                            <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                                                ...
                                            </span>
                                        ) : (
                                            <button
                                                key={page}
                                                className={`pagination-number ${validCurrentPage === page ? "active" : ""}`}
                                                onClick={() => handlePageChange(page as number)}
                                                aria-current={validCurrentPage === page ? "page" : undefined}
                                                aria-label={`Ir a página ${page}`}
                                            >
                                                {page}
                                            </button>
                                        )
                                    ))}
                                </div>

                                <button
                                    className="pagination-btn pagination-next"
                                    onClick={() => validCurrentPage < totalPages && handlePageChange(validCurrentPage + 1)}
                                    disabled={validCurrentPage === totalPages}
                                    aria-label="Página siguiente"
                                >
                                    <i className="fas fa-chevron-right" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </>
    )
}
