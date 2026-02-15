/**
 * Carrusel horizontal de productos con flechas y, en laptop, botón "Ver más" al final.
 * En móvil incluye swipe y tarjeta "Ver más"; en desktop solo productos y botón Ver más a la derecha.
 */
import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { useIsMobile } from "../../hooks/useIsMobile"
import { useTouchCarousel } from "../../hooks/useTouchCarousel"
import type { Product } from "../../types/Product"
import type { ProductCarouselSlideConfig } from "./ProductCarouselSlide"
import { ProductCarouselSlide } from "./ProductCarouselSlide"

export interface ProductCarouselProps {
    title: string
    products: Product[]
    getItemConfig?: (
        product: Product
    ) => ProductCarouselSlideConfig | undefined
    onNavigate: (id: number) => void
    onAddToCart: (name: string, price: string) => void
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

// En móvil: productos + tarjeta "Ver Más". En laptop: solo productos (el "Ver más" es el botón derecho).
function getTotalItems(productsLength: number, isMobile: boolean): number {
    return isMobile ? productsLength + 1 : productsLength
}

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
    const isMobile = useIsMobile()
    const totalItems = getTotalItems(products.length, isMobile)
    // Referencia del carousel para eventos táctiles
    const carouselRef = useTouchCarousel({
        onSwipeLeft: () => moveCarousel(1, setCurrentIndex, totalItems),
        onSwipeRight: () =>
            moveCarousel(-1, setCurrentIndex, totalItems),
        minSwipeDistance: 50,
    })

    // Autoplay en desktop y móvil
    useEffect(() => {
        // Activar autoplay con intervalo según dispositivo
        const interval = setInterval(() => {
            setCurrentIndex((prev) => {
                let next = prev + 1
                if (next >= totalItems) next = 0
                return next
            })
        }, isMobile ? 4000 : 5000)
        return () => clearInterval(interval)
    }, [totalItems, isMobile])

    if (products.length === 0) return null

    return (
        <>
            <h2 className="carousel-title">{title}</h2>
            {/* Contenedor con referencia para eventos táctiles */}
            <div ref={carouselRef} className="products-carousel-container">
                {/* Botón anterior - oculto en móvil */}
                {!isMobile && (
                    <button
                        type="button"
                        className="carousel-button carousel-button-prev"
                        onClick={() =>
                            moveCarousel(-1, setCurrentIndex, totalItems)
                        }
                        aria-label="Producto anterior"
                    >
                        <i className="fas fa-chevron-left" aria-hidden />
                    </button>
                )}
                <div className="carousel-viewport">
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
                                    className={`carousel-item ${
                                        isActive ? "active" : ""
                                    } ${badgeClass}`}
                                    style={{
                                        transform: `translateX(${offset * 100}%) scale(${
                                            isActive ? 1 : 0.85
                                        })`,
                                        opacity:
                                            Math.abs(offset) > 1
                                                ? 0
                                                : 1 -
                                                  Math.abs(offset) * 0.3,
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
                        {/* Tarjeta "Ver Más" solo en móvil; en laptop el botón derecho hace esa función */}
                        {seeMorePath && isMobile && (() => {
                            const seeMoreIndex = products.length
                            const isActive = seeMoreIndex === currentIndex
                            const offset = seeMoreIndex - currentIndex
                            return (
                                <div
                                    className={`carousel-item see-more-card ${
                                        isActive ? "active" : ""
                                    }`}
                                    style={{
                                        transform: `translateX(${offset * 100}%) scale(${
                                            isActive ? 1 : 0.85
                                        })`,
                                        opacity:
                                            Math.abs(offset) > 1
                                                ? 0
                                                : 1 -
                                                  Math.abs(offset) * 0.3,
                                    }}
                                >
                                    <button
                                        type="button"
                                        className="see-more-button"
                                        onClick={() => navigate(seeMorePath)}
                                        aria-label="Ver más productos"
                                    >
                                        <i className="fas fa-arrow-right" aria-hidden />
                                        <span>Ver Más</span>
                                    </button>
                                </div>
                            )
                        })()}
                    </div>
                </div>
                {/* Botón siguiente: en laptop al final se convierte en "Ver más" */}
                {!isMobile && (
                    currentIndex === totalItems - 1 && seeMorePath ? (
                        <button
                            type="button"
                            className="carousel-button carousel-button-next carousel-button-vermas"
                            onClick={() => navigate(seeMorePath)}
                            aria-label="Ver más productos"
                        >
                            <span className="carousel-button-vermas-text">Ver más</span>
                            <i className="fas fa-arrow-right" aria-hidden />
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="carousel-button carousel-button-next"
                            onClick={() =>
                                moveCarousel(1, setCurrentIndex, totalItems)
                            }
                            aria-label="Siguiente producto"
                        >
                            <i className="fas fa-chevron-right" aria-hidden />
                        </button>
                    )
                )}
            </div>
            <div className="carousel-indicators">
                {Array.from({ length: totalItems }).map((_, index) => (
                    <button
                        key={`indicator-${index}`}
                        type="button"
                        className={`indicator ${
                            index === currentIndex ? "active" : ""
                        }`}
                        onClick={() => setCurrentIndex(index)}
                        aria-label={`Ir al producto ${index + 1}`}
                    />
                ))}
            </div>
        </>
    )
}
