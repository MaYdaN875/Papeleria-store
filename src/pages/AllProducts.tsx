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
import { filterProductsBySearch } from "../hooks/useProductSearch"
import { fetchStoreCategories, fetchStoreProducts } from "../services/storeApi"
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
 * búsqueda por URL (?search=), filtrado por categoría del navbar (?category=),
 * y vista adaptada a móvil (drawer de filtros).
 */

const CATEGORY_FALLBACK_NAMES: Record<string, string> = {
    "oficina-y-escolares": "Oficina y Escolares",
    "arte-y-manualidades": "Arte y Manualidades",
    "miscelanea-y-regalos": "Miscelánea y Regalos",
    "servicios-digitales-e-impresiones": "Servicios Digitales e Impresiones"
}

const CATEGORY_FALLBACK_ALIASES: Record<string, string[]> = {
    "oficina-y-escolares": ["oficina y escolares"],
    "arte-y-manualidades": ["arte y manualidades"],
    "miscelanea-y-regalos": ["miscelánea y regalos"],
    "servicios-digitales-e-impresiones": ["servicios digitales e impresiones"],
}

function normalizeCategoryText(value: string): string {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
}

function getBrand(product: Product): string {
    return product.brand ?? ""
}

function getBadgeForProduct(product: Product): ProductCardBadge | undefined {
    if (!product.originalPrice || product.originalPrice <= product.price) return undefined

    const discountPercent = product.discountPercentage ??
        Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)

    if (discountPercent <= 0) return undefined

    return { type: "discount", value: `-${discountPercent}%` }
}

function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
}

function filterProducts(productsList: Product[], filters: FilterState): Product[] {
    return productsList.filter((product) => {
        const brand = getBrand(product)

        // Filtro de "Productos" (tipos/categorías manuales)
        if (filters.productos.length > 0) {
            const isTypeMatch = filters.productos.some((type) => {
                const searchLower = normalizeText(type)
                // Intentar coincidencia con la palabra raíz (sin 's' final para disparidad singular/plural)
                const root = (searchLower.length > 3 && searchLower.endsWith('s')) 
                    ? searchLower.slice(0, -1) 
                    : searchLower

                const prodName = normalizeText(product.name)
                const prodCat = normalizeText(product.category || "")

                return (
                    prodName.includes(root) ||
                    prodCat.includes(root)
                )
            })
            if (!isTypeMatch) return false
        }

        // Filtro de Marcas
        if (filters.brands.length > 0 && !filters.brands.includes(brand)) return false

        if (filters.mayoreo && !product.mayoreo) return false
        if (filters.menudeo && !product.menudeo) return false

        // Usar el precio correspondiente al modo activo para el filtro de rango
        const activePrice =
            filters.mayoreo && product.mayoreoPrice != null
                ? product.mayoreoPrice
                : filters.menudeo && product.menudeoPrice != null
                    ? product.menudeoPrice
                    : product.price

        if (
            activePrice < filters.priceRange[0] ||
            activePrice > filters.priceRange[1]
        )
            return false

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
    const categoryQuery = searchParams.get("category") || ""
    const subCategoryQuery = searchParams.get("sub") || ""
    const pageFromUrl = Number.parseInt(searchParams.get("page") || "1", 10)
    const isMobile = useIsMobile()

    // Inicializar filtros desde la URL si existen
    const initialFilters = useMemo<FilterState>(() => {
        const productos = searchParams.get("filter_productos")?.split(",").filter(Boolean) || []
        const brands = searchParams.get("filter_brands")?.split(",").filter(Boolean) || []
        const mayoreo = searchParams.get("filter_mayoreo") === "true"
        const menudeo = searchParams.get("filter_menudeo") === "true"
        const minPrice = Number(searchParams.get("filter_min") || "0")
        const maxPrice = Number(searchParams.get("filter_max") || String(DEFAULT_MAX_PRICE_FILTER))

        return {
            productos,
            brands,
            mayoreo,
            menudeo,
            priceRange: [minPrice, maxPrice],
        }
    }, [searchParams])

    const [filters, setFilters] = useState<FilterState>(initialFilters)
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
    const [isClosing, setIsClosing] = useState(false)
    const [storeProducts, setStoreProducts] = useState<Product[]>([])
    const [isLoadingProducts, setIsLoadingProducts] = useState(true)
    const [productsLoadError, setProductsLoadError] = useState("")
    const [categoryLabelMap, setCategoryLabelMap] = useState<Record<string, string>>({})
    const [categoryAliasMap, setCategoryAliasMap] = useState<Record<string, string[]>>(CATEGORY_FALLBACK_ALIASES)
    const [mainCategoryNames, setMainCategoryNames] = useState<Set<string>>(new Set())

    // Sincronizar filtros con la URL cuando cambian
    const handleFilterChange = (newFilters: FilterState) => {
        setFilters(newFilters)
        
        const params = new URLSearchParams(searchParams)
        
        if (newFilters.productos.length > 0) {
            params.set("filter_productos", newFilters.productos.join(","))
        } else {
            params.delete("filter_productos")
        }
        
        if (newFilters.brands.length > 0) {
            params.set("filter_brands", newFilters.brands.join(","))
        } else {
            params.delete("filter_brands")
        }
        
        if (newFilters.mayoreo) params.set("filter_mayoreo", "true")
        else params.delete("filter_mayoreo")
        
        if (newFilters.menudeo) params.set("filter_menudeo", "true")
        else params.delete("filter_menudeo")
        
        if (newFilters.priceRange[0] > 0) {
            params.set("filter_min", String(newFilters.priceRange[0]))
        } else {
            params.delete("filter_min")
        }
        
        if (newFilters.priceRange[1] < DEFAULT_MAX_PRICE_FILTER) {
            params.set("filter_max", String(newFilters.priceRange[1]))
        } else {
            params.delete("filter_max")
        }

        // Siempre resetear a página 1 cuando cambian los filtros
        params.delete("page")
        
        navigate(`/all-products?${params.toString()}`, { replace: true })
    }

    const handleCloseDrawer = () => {
        setIsClosing(true)
        setTimeout(() => {
            setIsFilterDrawerOpen(false)
            setIsClosing(false)
        }, 300)
    }

    // Resetear paginación y drawer cuando cambia la búsqueda o categoría
    useEffect(() => {
        window.scrollTo(0, 0)
        syncCartCount()
        setIsFilterDrawerOpen(false)
    }, [searchQuery, categoryQuery, subCategoryQuery])

    // Cargar productos al montar el componente
    const loadStoreProducts = useCallback(async () => {
        setIsLoadingProducts(true)
        setProductsLoadError("")

        try {
            const result = await fetchStoreProducts()
            if (!result.ok || !result.products) {
                setProductsLoadError(result.message ?? "No se pudo cargar catálogo desde la API.")
                setStoreProducts([])
                setIsLoadingProducts(false)
                return
            }

            setStoreProducts(result.products)
            setIsLoadingProducts(false)
        } catch (loadError) {
            console.error(loadError)
            setProductsLoadError("No se pudo conectar con el servidor. Por favor intenta de nuevo.")
            setStoreProducts([])
            setIsLoadingProducts(false)
        }
    }, [])

    useEffect(() => {
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
    }, [loadStoreProducts])

    useEffect(() => {
        async function loadStoreCategories() {
            try {
                const result = await fetchStoreCategories()
                if (!result.ok || !result.categories) return

                const labels: Record<string, string> = {}
                const aliases: Record<string, string[]> = {}
                const mainNames = new Set<string>()

                for (const categoryNode of result.categories) {
                    const normalizedSlug = normalizeCategoryText(categoryNode.name).replace(/[^a-z0-9]+/g, "-")
                    labels[normalizedSlug] = categoryNode.name
                    mainNames.add(normalizeCategoryText(categoryNode.name))
                    
                    aliases[normalizedSlug] = [
                        normalizeCategoryText(categoryNode.name),
                        ...categoryNode.children.map((child) => normalizeCategoryText(child.name))
                    ]
                }
                setCategoryLabelMap(labels)
                setCategoryAliasMap(aliases)
                setMainCategoryNames(mainNames)
            } catch (loadError) {
                console.error(loadError)
            }
        }

        void loadStoreCategories()
    }, [])

    const baseProducts = useMemo(() => {
        if (!categoryQuery) return storeProducts
        
        const allowedKeywords = categoryAliasMap[categoryQuery]
        if (!allowedKeywords || allowedKeywords.length === 0) return storeProducts
        
        return storeProducts.filter(product => {
            // Solo buscar en la categoría exacta para evitar falsos positivos
            const productCategory = (product.category || "")
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .trim()

            // Filtro estrictamente igual: el nombre de la categoría debe machar 1 a 1
            return allowedKeywords.some(keyword => productCategory === keyword)
        })
    }, [storeProducts, categoryQuery, categoryAliasMap])

    const productsAfterSubcategory = useMemo(() => {
        if (!subCategoryQuery) return baseProducts
        const normalizedSubcategory = normalizeCategoryText(subCategoryQuery)

        return baseProducts.filter((product) => {
            const normalizedCategory = normalizeCategoryText(product.category || "")
            return normalizedCategory === normalizedSubcategory
        })
    }, [baseProducts, subCategoryQuery])

    // Primero filtrar por búsqueda si existe, luego aplicar filtros adicionales
    const productsAfterSearch = useMemo(() => {
        if (!searchQuery) return productsAfterSubcategory

        return filterProductsBySearch(productsAfterSubcategory, searchQuery)
    }, [productsAfterSubcategory, searchQuery])

    const filteredProducts = useMemo(
        () => filterProducts(productsAfterSearch, filters),
        [productsAfterSearch, filters]
    )

    // Aplicar transformación de precios según filtro mayoreo/menudeo
    const displayProducts = useMemo(
        () => applyPriceMode(filteredProducts, filters),
        [filteredProducts, filters]
    )

    // Extraer marcas únicas dinámicamente de los productos visibles (antes de filtro de marca)
    const availableBrands = useMemo(() => {
        const brandSet = new Set<string>()
        for (const product of productsAfterSearch) {
            const brand = product.brand
            if (brand) brandSet.add(brand)
        }
        return Array.from(brandSet).sort()
    }, [productsAfterSearch])

    const availableSubclasses = useMemo(() => {
        const subclassSet = new Set<string>()
        for (const product of productsAfterSearch) {
            const category = product.category
            if (category && category !== "Sin categoría") {
                const normalized = normalizeCategoryText(category)
                // No incluir en el filtro si es una categoría principal
                if (!mainCategoryNames.has(normalized)) {
                    subclassSet.add(category)
                }
            }
        }
        return Array.from(subclassSet).sort()
    }, [productsAfterSearch, mainCategoryNames])
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
        addProductToCart(
            product.name,
            product.price.toFixed(2),
            1,
            product.id,
            product.image
        )
    }, [])

    const handleNavigateToProduct = useCallback((productId: number) => {
        // Preservar todos los parámetros de búsqueda actuales (filtros, página, modo, etc.)
        const currentParams = new URLSearchParams(searchParams)
        if (activeMode) {
            currentParams.append("mode", activeMode)
        }
        navigate(`/product/${productId}?${currentParams.toString()}`)
    }, [navigate, activeMode, searchParams])

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
                                : categoryQuery && (categoryLabelMap[categoryQuery] ?? CATEGORY_FALLBACK_NAMES[categoryQuery])
                                ? `Categoría: ${categoryLabelMap[categoryQuery] ?? CATEGORY_FALLBACK_NAMES[categoryQuery]}`
                                : "Todos Nuestros Productos"}
                        </h1>
                        <p className="page-subtitle">
                            {searchQuery
                                ? `Mostrando ${filteredProducts.length} resultado(s) para tu búsqueda`
                                : categoryQuery && (categoryLabelMap[categoryQuery] ?? CATEGORY_FALLBACK_NAMES[categoryQuery])
                                ? `Explora nuestros productos de ${categoryLabelMap[categoryQuery] ?? CATEGORY_FALLBACK_NAMES[categoryQuery]}`
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
                            initialFilters={filters}
                            onFilterChange={handleFilterChange}
                            onClose={handleCloseDrawer}
                            availableBrands={availableBrands}
                            availableSubclasses={availableSubclasses}
                        />
                    </div>

                    <div className="products-content-area">
                        {isLoadingProducts && (
                            <p className="no-products-message">
                                Cargando productos...
                            </p>
                        )}
                        {!isLoadingProducts && productsLoadError && (
                            <div className="api-error-state">
                                <div className="api-error-icon-wrapper">
                                    <i className="fas fa-plug" />
                                </div>
                                <h2 className="api-error-title">No se pudo cargar el catálogo</h2>
                                <p className="api-error-subtitle">
                                    Estamos actualizando nuestra tienda. Por favor vuelve a intentarlo en unos momentos.
                                </p>
                                <button
                                    className="api-error-retry-btn"
                                    onClick={() => void loadStoreProducts()}
                                >
                                    <i className="fas fa-sync-alt" />
                                    Reintentar
                                </button>
                            </div>
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
