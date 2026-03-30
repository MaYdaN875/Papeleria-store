/**
 * Panel de filtros para AllProducts: categorías (productos), marcas, mayoreo/menudeo, rango de precio.
 * Emite onFilterChange al cambiar cualquier filtro. Usado en sidebar (desktop) y drawer (móvil).
 */
import { useCallback, useState } from "react"

export interface FilterState {
    productos: string[]
    brands: string[]
    mayoreo: boolean
    menudeo: boolean
    priceRange: [number, number]
}

export interface FilterPanelProps {
    readonly initialFilters?: FilterState
    readonly onFilterChange: (filters: FilterState) => void
    /** Callback para cerrar el panel (usado en móvil). */
    readonly onClose?: () => void
    /** Marcas disponibles extraídas dinámicamente de los productos cargados. */
    readonly availableBrands?: string[]
}

const DEFAULT_MAX_PRICE_FILTER = 100000

const getProducts = (): string[] => {
    return [
        "Bolígrafos",
        "Carpetas",
        "Cinta",
        "Corrector",
        "Cuaderno",
        "Cuadernos",
        "Engrapadora",
        "Estuches",
        "Gomas",
        "Lápices",
        "Lápiz",
        "Marcadores",
        "Papel",
        "Pegamento",
        "Plumas",
    ]
}



/* ================================
   COMPONENTE: FilterPanel
   Panel lateral de filtros con múltiples opciones
   ================================ */

export function FilterPanel({ initialFilters, onFilterChange, onClose, availableBrands }: FilterPanelProps) {
    /* Estado para controlar qué secciones están expandidas */
    const [expandedSections, setExpandedSections] = useState<
        Record<string, boolean>
    >({
        productos: true,
        brands: true,
        mayoreo: false,
        menudeo: false,
        precios: true,
    })

    /* Estado principal de filtros */
    const [filters, setFilters] = useState<FilterState>(
        initialFilters ?? {
            productos: [],
            brands: [],
            mayoreo: false,
            menudeo: false,
            priceRange: [0, DEFAULT_MAX_PRICE_FILTER],
        }
    )

    const filterProducts = getProducts()
    const brands = availableBrands ?? []

    /* ================================
       MANEJADORES DE EVENTOS
       ================================ */

    /* Alternar la expansión/contracción de una sección */
    const toggleSection = useCallback((section: string) => {
        setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
    }, [])

    /* Actualizar filtros y notificar al componente padre */
    const updateFilters = useCallback(
        (newFilters: FilterState) => {
            setFilters(newFilters)
            onFilterChange(newFilters)
        },
        [onFilterChange]
    )

    /* Manejar cambios en filtro de productos */
    const handleProductChange = useCallback(
        (product: string) => {
            const newProducts = filters.productos.includes(product)
                ? filters.productos.filter((p) => p !== product)
                : [...filters.productos, product]
            updateFilters({ ...filters, productos: newProducts })
        },
        [filters, updateFilters]
    )

    /* Manejar cambios en filtro de marcas */
    const handleBrandChange = useCallback(
        (brand: string) => {
            const newBrands = filters.brands.includes(brand)
                ? filters.brands.filter((b) => b !== brand)
                : [...filters.brands, brand]
            updateFilters({ ...filters, brands: newBrands })
        },
        [filters, updateFilters]
    )

    /* Manejar cambios en filtro de mayoreo */
    const handleMayoreoChange = useCallback(() => {
        updateFilters({ ...filters, mayoreo: !filters.mayoreo })
    }, [filters, updateFilters])

    /* Manejar cambios en filtro de menudeo */
    const handleMenudeoChange = useCallback(() => {
        updateFilters({ ...filters, menudeo: !filters.menudeo })
    }, [filters, updateFilters])

    /* Manejar cambios en rango de precios */
    const handlePriceChange = useCallback(
        (type: "min" | "max", value: number) => {
            const newRange: [number, number] =
                type === "min"
                    ? [value, filters.priceRange[1]]
                    : [filters.priceRange[0], value]
            updateFilters({ ...filters, priceRange: newRange })
        },
        [filters, updateFilters]
    )

    return (
        <aside className="filter-panel">
            <div className="filter-panel-header">
                <h3 className="filter-panel-title">Filtros</h3>
                {onClose && (
                    <button
                        type="button"
                        className="filter-panel-close-btn"
                        onClick={onClose}
                        aria-label="Cerrar filtros"
                    >
                        <i className="fas fa-times" />
                    </button>
                )}
            </div>

            {/* SECCIÓN: FILTRO DE PRODUCTOS */}
            <div className="filter-section">
                <button
                    className={`filter-section-header ${expandedSections.productos ? "expanded" : ""}`}
                    onClick={() => toggleSection("productos")}
                    type="button"
                >
                    <span>Productos</span>
                    <i
                        className={`fas fa-chevron-${expandedSections.productos ? "up" : "down"}`}
                    />
                </button>
                {expandedSections.productos && (
                    <div className="filter-section-content">
                        {filterProducts.length > 0 ? (
                            filterProducts.map((product) => (
                                <label key={product} className="filter-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={filters.productos.includes(product)}
                                        onChange={() => handleProductChange(product)}
                                    />
                                    <span>{product}</span>
                                </label>
                            ))
                        ) : (
                            <p className="no-items">No hay productos disponibles</p>
                        )}
                    </div>
                )}
            </div>

            {/* SECCIÓN: FILTRO DE MARCAS */}
            <div className="filter-section">
                <button
                    className={`filter-section-header ${expandedSections.brands ? "expanded" : ""}`}
                    onClick={() => toggleSection("brands")}
                    type="button"
                >
                    <span>Marcas</span>
                    <i
                        className={`fas fa-chevron-${expandedSections.brands ? "up" : "down"}`}
                    />
                </button>
                {expandedSections.brands && (
                    <div className="filter-section-content brands-list-container">
                        {brands.length > 0 ? (
                            brands.map((brand) => (
                                <label key={brand} className="filter-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={filters.brands.includes(brand)}
                                        onChange={() => handleBrandChange(brand)}
                                    />
                                    <span>{brand}</span>
                                </label>
                            ))
                        ) : (
                            <p className="no-items">No hay marcas disponibles</p>
                        )}
                    </div>
                )}
            </div>

            {/* SECCIÓN: FILTRO DE MAYOREO */}
            <div className="filter-section">
                <button
                    className={`filter-section-header ${expandedSections.mayoreo ? "expanded" : ""}`}
                    onClick={() => toggleSection("mayoreo")}
                    type="button"
                >
                    <span>Mayoreo</span>
                    <i
                        className={`fas fa-chevron-${expandedSections.mayoreo ? "up" : "down"}`}
                    />
                </button>
                {expandedSections.mayoreo && (
                    <div className="filter-section-content">
                        <label className="filter-checkbox">
                            <input
                                type="checkbox"
                                checked={filters.mayoreo}
                                onChange={handleMayoreoChange}
                            />
                            <span>Productos de Mayoreo</span>
                        </label>
                    </div>
                )}
            </div>

            {/* SECCIÓN: FILTRO DE MENUDEO */}
            <div className="filter-section">
                <button
                    className={`filter-section-header ${expandedSections.menudeo ? "expanded" : ""}`}
                    onClick={() => toggleSection("menudeo")}
                    type="button"
                >
                    <span>Menudeo</span>
                    <i
                        className={`fas fa-chevron-${expandedSections.menudeo ? "up" : "down"}`}
                    />
                </button>
                {expandedSections.menudeo && (
                    <div className="filter-section-content">
                        <label className="filter-checkbox">
                            <input
                                type="checkbox"
                                checked={filters.menudeo}
                                onChange={handleMenudeoChange}
                            />
                            <span>Productos de Menudeo</span>
                        </label>
                    </div>
                )}
            </div>

            {/* SECCIÓN: FILTRO DE PRECIOS */}
            <div className="filter-section">
                <button
                    className={`filter-section-header ${expandedSections.precios ? "expanded" : ""}`}
                    onClick={() => toggleSection("precios")}
                    type="button"
                >
                    <span>Precios</span>
                    <i
                        className={`fas fa-chevron-${expandedSections.precios ? "up" : "down"}`}
                    />
                </button>
                {expandedSections.precios && (
                    <div className="filter-section-content">
                        <div className="price-range-container">
                            <div className="price-input-group">
                                <label htmlFor="price-min">Mínimo</label>
                                <input
                                    id="price-min"
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={
                                        filters.priceRange[0] === 0
                                            ? ""
                                            : filters.priceRange[0]
                                    }
                                    onChange={(e) => {
                                        const value =
                                            e.target.value === ""
                                                ? 0
                                                : Number(e.target.value)
                                        handlePriceChange("min", value)
                                    }}
                                    onBlur={(e) => {
                                        if (e.target.value === "")
                                            handlePriceChange("min", 0)
                                    }}
                                    className="price-input"
                                />
                            </div>
                            <div className="price-input-group">
                                <label htmlFor="price-max">Máximo</label>
                                <input
                                    id="price-max"
                                    type="number"
                                    min="0"
                                    placeholder={String(DEFAULT_MAX_PRICE_FILTER)}
                                    value={
                                        filters.priceRange[1] === DEFAULT_MAX_PRICE_FILTER
                                            ? ""
                                            : filters.priceRange[1]
                                    }
                                    onChange={(e) => {
                                        const value =
                                            e.target.value === ""
                                                ? DEFAULT_MAX_PRICE_FILTER
                                                : Number(e.target.value)
                                        handlePriceChange("max", value)
                                    }}
                                    onBlur={(e) => {
                                        if (e.target.value === "")
                                            handlePriceChange("max", DEFAULT_MAX_PRICE_FILTER)
                                    }}
                                    className="price-input"
                                />
                            </div>
                        </div>
                        <div className="price-range-display">
                            ${filters.priceRange[0]} - ${filters.priceRange[1]}
                        </div>
                    </div>
                )}
            </div>
        </aside>
    )
}
