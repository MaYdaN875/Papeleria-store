import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import type { Product } from "../types/Product"
import type { ProductCarouselSlideConfig } from "./ProductCarouselSlide"
import { ProductCarouselSlide } from "./ProductCarouselSlide"

export interface ProductCarouselProps {
    /** Título de la sección (ej. "🎨 Arte & Manualidades") */
    title: string
    /** Lista de productos a mostrar en el carrusel */
    products: Product[]
    /** Obtiene badge, originalPrice y brand por producto (por id) */
    getItemConfig?: (product: Product) => ProductCarouselSlideConfig | undefined
    /** Navegación al detalle del producto */
    onNavigate: (id: number) => void
    /** Callback al agregar al carrito */
    onAddToCart: (name: string, price: string) => void
    /** Ruta del botón "Ver Más" (ej. "/all-products"). Si no se pasa, no se muestra. */
    seeMorePath?: string
}

function moveCarousel(
    direction: number,
    setIndex: React.Dispatch<React.SetStateAction<number>>,
    length: number
) {
    setIndex((prev) => {
        let next = prev + direction
        if (next < 0) next = length - 1
        if (next >= length) next = 0
        return next
    })
}

/**
 * Carrusel de productos con título, flechas prev/next, indicadores y opcional "Ver Más".
 */
export function ProductCarousel({
    title,
    products,
    getItemConfig,
    onNavigate,
    onAddToCart,
    seeMorePath = "/all-products",
}: ProductCarouselProps) {
    const navigate = useNavigate()
    const [currentIndex, setCurrentIndex] = useState(0)

    // Auto-avance del carousel cada 5 segundos
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => {
                let next = prev + 1
                if (next >= products.length) next = 0
                return next
            })
        }, 5000)

        return () => clearInterval(interval)
    }, [products.length])

    if (products.length === 0) return null

    return (
        <>
            <h2 className="carousel-title">{title}</h2>
            <div className="products-carousel-container">
                <button
                    type="button"
                    className="carousel-button carousel-button-prev"
                    onClick={() => moveCarousel(-1, setCurrentIndex, products.length)}
                    aria-label="Producto anterior"
                >
                    <i className="fas fa-chevron-left" aria-hidden="true" />
                </button>
                <div className="carousel-track">
                    {products.map((product, index) => {
                        const isActive = index === currentIndex
                        const offset = index - currentIndex
                        let badgeClass = ""
                        if (offset > 0) badgeClass = "next"
                        else if (offset < 0) badgeClass = "prev"
                        const config = getItemConfig?.(product)
                        return (
                            <div
                                key={product.id}
                                className={`carousel-item ${isActive ? "active" : ""} ${badgeClass}`}
                                style={{
                                    transform: `translateX(${offset * 100}%) scale(${isActive ? 1 : 0.85})`,
                                    opacity: Math.abs(offset) > 1 ? 0 : 1 - Math.abs(offset) * 0.3,
                                }}
                            >
                                <ProductCarouselSlide
                                    product={product}
                                    config={config}
                                    onNavigate={onNavigate}
                                    onAddToCart={onAddToCart}
                                />
                            </div>
                        )
                    })}
                </div>
                {currentIndex === products.length - 1 && seeMorePath ? (
                    <button
                        type="button"
                        className="btn-see-more-carousel"
                        onClick={() => navigate(seeMorePath)}
                        aria-label="Ver más productos"
                    >
                        <i className="fas fa-arrow-right" aria-hidden="true" /> Ver Más
                    </button>
                ) : (
                    <button
                        type="button"
                        className="carousel-button carousel-button-next"
                        onClick={() => moveCarousel(1, setCurrentIndex, products.length)}
                        aria-label="Siguiente producto"
                    >
                        <i className="fas fa-chevron-right" aria-hidden="true" />
                    </button>
                )}
            </div>
            <div className="carousel-indicators">
                {products.map((_, index) => (
                    <button
                        key={`indicator-${index}`}
                        type="button"
                        className={`indicator ${index === currentIndex ? "active" : ""}`}
                        onClick={() => setCurrentIndex(index)}
                        aria-label={`Ir al producto ${index + 1}`}
                    />
                ))}
            </div>
        </>
    )
}
