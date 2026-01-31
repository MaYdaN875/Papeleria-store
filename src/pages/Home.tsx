import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { Carusel } from "../components/Carusel"
import { ProductCard } from "../components/ProductCard"
import { products } from "../data/products"
import type { Product } from "../types/Product"
import { addProductToCart, syncCartCount } from "../utils/cart"

/* ================================
   COMPONENTE: Home
   Página principal con ofertas, productos destacados (grid),
   carrusel Arte & Manualidades y carrusel Útiles Escolares
   ================================ */

const FEATURED_CONFIG: Record<
    number,
    { badge?: { type: "discount" | "sale"; value: string }; originalPrice?: number; brand?: string }
> = {
    1: { badge: { type: "discount", value: "-20%" }, originalPrice: 89.99, brand: "Staedtler" },
    2: { badge: { type: "sale", value: "HOT" }, brand: "Moleskine" },
    3: { badge: { type: "discount", value: "-15%" }, originalPrice: 120, brand: "Copic" },
    4: { badge: { type: "discount", value: "-25%" }, originalPrice: 150, brand: "Faber-Castell" },
    5: { badge: { type: "sale", value: "NUEVO" }, brand: "Canson" },
    6: { badge: { type: "discount", value: "-10%" }, originalPrice: 55, brand: "Esselte" },
}

const FEATURED_IDS = [1, 2, 3, 4, 5, 6]

const ART_CAROUSEL_CONFIG: Record<number, { badge?: { type: "discount" | "sale"; value: string }; originalPrice?: number; brand?: string }> = {
    3: { badge: { type: "discount", value: "-15%" }, originalPrice: 120, brand: "Copic" },
    8: { badge: { type: "discount", value: "-18%" }, originalPrice: 110, brand: "Faber-Castell" },
}

const SCHOOL_CAROUSEL_CONFIG: Record<number, { badge?: { type: "discount" | "sale"; value: string }; originalPrice?: number; brand?: string }> = {
    2: { badge: { type: "sale", value: "BESTSELLER" }, brand: "Moleskine" },
    9: { badge: { type: "sale", value: "NUEVO" }, brand: "Staedtler" },
    10: { badge: { type: "discount", value: "-15%" }, brand: "Staedtler" },
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

interface ProductCarouselSlideProps {
    product: Product
    badge?: { type: "discount" | "sale"; value: string }
    originalPrice?: number
    brand?: string
    onNavigate: (id: number) => void
    onAddToCart: (name: string, price: string) => void
}

function ProductCarouselSlide({
    product,
    badge,
    originalPrice,
    brand,
    onNavigate,
    onAddToCart,
}: ProductCarouselSlideProps) {
    return (
        <div
            className="product-card-carousel"
            onClick={() => onNavigate(product.id)}
            onKeyDown={(e) => e.key === "Enter" && onNavigate(product.id)}
            role="button"
            tabIndex={0}
        >
            <div className="product-image-carousel">
                {product.image.startsWith("/") ? (
                    <img src={product.image} alt={product.name} />
                ) : (
                    <div className="product-placeholder-carousel">{product.image || "📦"}</div>
                )}
                {badge && (
                    <div className={`product-badge ${badge.type}`}>{badge.value}</div>
                )}
            </div>
            <div className="product-info-carousel">
                <h4>{product.name}</h4>
                {brand && <p className="product-brand">Marca: {brand}</p>}
                <div className="product-rating" aria-hidden="true">
                    <i className="fas fa-star" />
                    <i className="fas fa-star" />
                    <i className="fas fa-star" />
                    <i className="fas fa-star" />
                    <i className="fas fa-star-half-alt" />
                </div>
                <div className="product-price">
                    {originalPrice != null && originalPrice > product.price && (
                        <span className="price-original">${originalPrice.toFixed(2)}</span>
                    )}
                    <span className="price-current">${product.price.toFixed(2)}</span>
                </div>
                <button
                    type="button"
                    className="btn-add-cart"
                    onClick={(e) => {
                        e.stopPropagation()
                        onAddToCart(product.name, product.price.toFixed(2))
                    }}
                >
                    <i className="fas fa-shopping-cart" aria-hidden="true" /> Agregar al carrito
                </button>
            </div>
        </div>
    )
}

export const Home = () => {
    const navigate = useNavigate()
    const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0)
    const [currentArtIndex, setCurrentArtIndex] = useState(0)
    const [currentSchoolIndex, setCurrentSchoolIndex] = useState(0)

    useEffect(() => {
        syncCartCount()
    }, [])

    const featuredProducts = products.filter((p) => FEATURED_IDS.includes(p.id))
    const artProducts = products.filter((p) => p.category === "Arte").slice(0, 5)
    const schoolProducts = products.filter((p) => p.category === "Escolar").slice(0, 5)

    const handleAddToCart = useCallback((name: string, price: string) => {
        addProductToCart(name, price)
    }, [])

    return (
        <>
            <section id="inicio" className="banner-principal">
                <Carusel type="banner" />
            </section>

            <section className="products-section">
                {/* ============ CARRUSEL PRODUCTOS DESTACADOS ============ */}
                {featuredProducts.length > 0 && (
                    <>
                        <h2 className="carousel-title">⭐ Productos Destacados</h2>
                        <div className="products-carousel-container">
                            <button
                                type="button"
                                className="carousel-button carousel-button-prev"
                                onClick={() => moveCarousel(-1, setCurrentFeaturedIndex, featuredProducts.length)}
                                aria-label="Producto anterior"
                            >
                                <i className="fas fa-chevron-left" aria-hidden="true" />
                            </button>
                            <div className="carousel-track">
                                {featuredProducts.map((product, index) => {
                                    const isActive = index === currentFeaturedIndex
                                    const offset = index - currentFeaturedIndex
                                    let badgeClass = ""
                                    if (offset > 0) badgeClass = "next"
                                    else if (offset < 0) badgeClass = "prev"
                                    const config = FEATURED_CONFIG[product.id]
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
                                                badge={config?.badge}
                                                originalPrice={config?.originalPrice}
                                                brand={config?.brand}
                                                onNavigate={(id) => navigate(`/product/${id}`)}
                                                onAddToCart={handleAddToCart}
                                            />
                                        </div>
                                    )
                                })}
                            </div>
                            {currentFeaturedIndex === featuredProducts.length - 1 ? (
                                <button
                                    type="button"
                                    className="btn-see-more-carousel"
                                    onClick={() => navigate("/all-products")}
                                    aria-label="Ver más productos"
                                >
                                    <i className="fas fa-arrow-right" aria-hidden="true" /> Ver Más
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="carousel-button carousel-button-next"
                                    onClick={() => moveCarousel(1, setCurrentFeaturedIndex, featuredProducts.length)}
                                    aria-label="Siguiente producto"
                                >
                                    <i className="fas fa-chevron-right" aria-hidden="true" />
                                </button>
                            )}
                        </div>
                        <div className="carousel-indicators">
                            {featuredProducts.map((_, index) => (
                                <button
                                    key={`featured-${index}`}
                                    type="button"
                                    className={`indicator ${index === currentFeaturedIndex ? "active" : ""}`}
                                    onClick={() => setCurrentFeaturedIndex(index)}
                                    aria-label={`Ir al producto ${index + 1}`}
                                />
                            ))}
                        </div>
                    </>
                )}

                {/* ============ CARRUSEL ARTE & MANUALIDADES ============ */}
                {artProducts.length > 0 && (
                    <>
                        <h2 className="carousel-title">🎨 Arte & Manualidades</h2>
                        <div className="products-carousel-container">
                            <button
                                type="button"
                                className="carousel-button carousel-button-prev"
                                onClick={() => moveCarousel(-1, setCurrentArtIndex, artProducts.length)}
                                aria-label="Producto anterior"
                            >
                                <i className="fas fa-chevron-left" aria-hidden="true" />
                            </button>
                            <div className="carousel-track">
                                {artProducts.map((product, index) => {
                                    const isActive = index === currentArtIndex
                                    const offset = index - currentArtIndex
                                    let badgeClass = ""
                                    if (offset > 0) badgeClass = "next"
                                    else if (offset < 0) badgeClass = "prev"
                                    const config = ART_CAROUSEL_CONFIG[product.id]
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
                                                badge={config?.badge}
                                                originalPrice={config?.originalPrice}
                                                brand={config?.brand}
                                                onNavigate={(id) => navigate(`/product/${id}`)}
                                                onAddToCart={handleAddToCart}
                                            />
                                        </div>
                                    )
                                })}
                            </div>
                            {currentArtIndex === artProducts.length - 1 ? (
                                <button
                                    type="button"
                                    className="btn-see-more-carousel"
                                    onClick={() => navigate("/all-products")}
                                    aria-label="Ver más productos"
                                >
                                    <i className="fas fa-arrow-right" aria-hidden="true" /> Ver Más
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="carousel-button carousel-button-next"
                                    onClick={() => moveCarousel(1, setCurrentArtIndex, artProducts.length)}
                                    aria-label="Siguiente producto"
                                >
                                    <i className="fas fa-chevron-right" aria-hidden="true" />
                                </button>
                            )}
                        </div>
                        <div className="carousel-indicators">
                            {artProducts.map((_, index) => (
                                <button
                                    key={`art-${index}`}
                                    type="button"
                                    className={`indicator ${index === currentArtIndex ? "active" : ""}`}
                                    onClick={() => setCurrentArtIndex(index)}
                                    aria-label={`Ir al producto ${index + 1}`}
                                />
                            ))}
                        </div>
                    </>
                )}

                {/* ============ CARRUSEL ÚTILES ESCOLARES ============ */}
                {schoolProducts.length > 0 && (
                    <>
                        <h2 className="carousel-title">📚 Útiles Escolares</h2>
                        <div className="products-carousel-container">
                            <button
                                type="button"
                                className="carousel-button carousel-button-prev"
                                onClick={() => moveCarousel(-1, setCurrentSchoolIndex, schoolProducts.length)}
                                aria-label="Producto anterior"
                            >
                                <i className="fas fa-chevron-left" aria-hidden="true" />
                            </button>
                            <div className="carousel-track">
                                {schoolProducts.map((product, index) => {
                                    const isActive = index === currentSchoolIndex
                                    const offset = index - currentSchoolIndex
                                    let badgeClass = ""
                                    if (offset > 0) badgeClass = "next"
                                    else if (offset < 0) badgeClass = "prev"
                                    const config = SCHOOL_CAROUSEL_CONFIG[product.id]
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
                                                badge={config?.badge}
                                                originalPrice={config?.originalPrice}
                                                brand={config?.brand}
                                                onNavigate={(id) => navigate(`/product/${id}`)}
                                                onAddToCart={handleAddToCart}
                                            />
                                        </div>
                                    )
                                })}
                            </div>
                            {currentSchoolIndex === schoolProducts.length - 1 ? (
                                <button
                                    type="button"
                                    className="btn-see-more-carousel"
                                    onClick={() => navigate("/all-products")}
                                    aria-label="Ver más productos"
                                >
                                    <i className="fas fa-arrow-right" aria-hidden="true" /> Ver Más
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="carousel-button carousel-button-next"
                                    onClick={() => moveCarousel(1, setCurrentSchoolIndex, schoolProducts.length)}
                                    aria-label="Siguiente producto"
                                >
                                    <i className="fas fa-chevron-right" aria-hidden="true" />
                                </button>
                            )}
                        </div>
                        <div className="carousel-indicators">
                            {schoolProducts.map((_, index) => (
                                <button
                                    key={`school-${index}`}
                                    type="button"
                                    className={`indicator ${index === currentSchoolIndex ? "active" : ""}`}
                                    onClick={() => setCurrentSchoolIndex(index)}
                                    aria-label={`Ir al producto ${index + 1}`}
                                />
                            ))}
                        </div>
                    </>
                )}

            </section>
        </>
    )
}
