import { useCallback, useMemo, useState } from "react"
import { products } from "../data/products"

export interface FilterState {
    brands: string[]
    mayoreo: boolean
    menudeo: boolean
    priceRange: [number, number]
}

export interface FilterPanelProps {
    onFilterChange: (filters: FilterState) => void
}

// Obtener todas las marcas únicas de los productos dinámicamente
const getBrands = (): string[] => {
    const brandsSet = new Set(
        products
            .map(p => p.description.split(' ')[0])
            .filter(Boolean)
    )
    return Array.from(brandsSet).sort((a, b) => a.localeCompare(b))
}

export function FilterPanel({ onFilterChange }: FilterPanelProps) {
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        brands: true,
        mayoreo: false,
        menudeo: false,
        precios: true,
    })

    const [filters, setFilters] = useState<FilterState>({
        brands: [],
        mayoreo: false,
        menudeo: false,
        priceRange: [0, 1000],
    })

    const brands = getBrands()

    /* ================================
       MANEJO DE ESTADOS.
       ================================ */

    const toggleSection = useCallback((section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }))
    }, [])

    const updateFilters = useCallback((newFilters: FilterState) => {
        setFilters(newFilters)
        onFilterChange(newFilters)
    }, [onFilterChange])

    const handleBrandChange = useCallback((brand: string) => {
        const newBrands = filters.brands.includes(brand)
            ? filters.brands.filter(b => b !== brand)
            : [...filters.brands, brand]
        updateFilters({ ...filters, brands: newBrands })
    }, [filters, updateFilters])

    const handleMayoreoChange = useCallback(() => {
        updateFilters({ ...filters, mayoreo: !filters.mayoreo })
    }, [filters, updateFilters])

    const handleMenudeoChange = useCallback(() => {
        updateFilters({ ...filters, menudeo: !filters.menudeo })
    }, [filters, updateFilters])

    const handlePriceChange = useCallback((type: 'min' | 'max', value: number) => {
        const newRange: [number, number] = type === 'min'
            ? [value, filters.priceRange[1]]
            : [filters.priceRange[0], value]
        updateFilters({ ...filters, priceRange: newRange })
    }, [filters, updateFilters])

    return (
        <aside className="filter-panel">
            <h3 className="filter-panel-title">Filtros</h3>

            {/* Sección Marcas */}
            <div className="filter-section">
                <button
                    className={`filter-section-header ${expandedSections.brands ? 'expanded' : ''}`}
                    onClick={() => toggleSection('brands')}
                    type="button"
                >
                    <span>Marcas</span>
                    <i className={`fas fa-chevron-${expandedSections.brands ? 'up' : 'down'}`}></i>
                </button>
                {expandedSections.brands && (
                    <div className="filter-section-content">
                        {brands.length > 0 ? (
                            brands.map(brand => (
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

            {/* Sección Mayoreo */}
            <div className="filter-section">
                <button
                    className={`filter-section-header ${expandedSections.mayoreo ? 'expanded' : ''}`}
                    onClick={() => toggleSection('mayoreo')}
                    type="button"
                >
                    <span>Mayoreo</span>
                    <i className={`fas fa-chevron-${expandedSections.mayoreo ? 'up' : 'down'}`}></i>
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

            {/* Sección Menudeo */}
            <div className="filter-section">
                <button
                    className={`filter-section-header ${expandedSections.menudeo ? 'expanded' : ''}`}
                    onClick={() => toggleSection('menudeo')}
                    type="button"
                >
                    <span>Menudeo</span>
                    <i className={`fas fa-chevron-${expandedSections.menudeo ? 'up' : 'down'}`}></i>
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

            {/* Seccion Precios */}
            <div className="filter-section">
                <button
                    className={`filter-section-header ${expandedSections.precios ? 'expanded' : ''}`}
                    onClick={() => toggleSection('precios')}
                    type="button"
                >
                    <span>Precios</span>
                    <i className={`fas fa-chevron-${expandedSections.precios ? 'up' : 'down'}`}></i>
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
                                    value={filters.priceRange[0] === 0 ? '' : filters.priceRange[0]}
                                    onChange={(e) => {
                                        const value = e.target.value === '' ? 0 : Number(e.target.value)
                                        handlePriceChange('min', value)
                                    }}
                                    onBlur={(e) => {
                                        if (e.target.value === '') {
                                            handlePriceChange('min', 0)
                                        }
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
                                    placeholder="1000"
                                    value={filters.priceRange[1] === 1000 ? '' : filters.priceRange[1]}
                                    onChange={(e) => {
                                        const value = e.target.value === '' ? 1000 : Number(e.target.value)
                                        handlePriceChange('max', value)
                                    }}
                                    onBlur={(e) => {
                                        if (e.target.value === '') {
                                            handlePriceChange('max', 1000)
                                        }
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
