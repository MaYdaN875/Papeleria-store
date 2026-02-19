/**
 * Carrusel genérico: tipo "banner" (home), "offers" o "products". Navegación por flechas e indicadores;
 * swipe en móvil, autoplay. Renderiza slides según type.
 */
import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { useIsMobile } from "../../hooks/useIsMobile"
import { useTouchCarousel } from "../../hooks/useTouchCarousel"

interface CarouselProps {
    type?: "offers" | "products" | "banner"
    bannerSlides?: CarouselBannerSlide[]
}

export interface CarouselBannerSlide {
    id: number
    title: string
    subtitle?: string
    price?: string
    oldPrice?: string
    sku?: string
    image: string
    bg?: string
    badge?: string
    description?: string
    icon?: string
    fullImage?: boolean
    redirectPath?: string
}

const defaultBannerOffers: CarouselBannerSlide[] = [
    { id: 1, title: "Prismacolor Premium", subtitle: "Lápices de colores con 150 piezas", price: "A: $1,699.99", oldPrice: "De: $3,338", sku: "SKU: 227021", image: "https://www.lumen.com.mx/media/catalog/product/cache/1/image/1200x/9df78eab33525d08d6e5fb8d27136e95/2/3/238760_1.jpg", bg: "linear-gradient(180deg, #B8D8E8 0%, #A8CDE0 100%)", badge: "PRECIO ESPECIAL", description: "Vigencia del 21 al 24 de enero de 2026.", icon: "🎨" },
    { id: 2, title: "Plotters HP", subtitle: "6 MESES SIN INTERESES", price: "A: $16,499.00", oldPrice: "De: $29,799.00", sku: "SKU: 349234", image: "https://www.lumen.com.mx/media/catalog/product/cache/1/image/1200x/9df78eab33525d08d6e5fb8d27136e95/3/4/349234_1.jpg", bg: "linear-gradient(180deg, #B8E6D5 0%, #A8DEC9 100%)", badge: "AHORRA $13,300", description: "Vigencia del 1 al 31 de enero de 2026.", icon: "🖨️" },
    { id: 3, title: "Oferta Especial", subtitle: "Descuentos hasta el", price: "40% OFF", oldPrice: "", sku: "", image: "https://images.unsplash.com/photo-1485070542212-31837a8b3a4a?w=600&h=500&fit=crop", bg: "linear-gradient(180deg, #F4DCC9 0%, #F0D9C0 100%)", badge: "", description: "En artículos seleccionados de papelería y útiles escolares.", icon: "🎁" },
    { id: 4, title: "Cuadernos Moleskine", subtitle: "Cuadernos Premium de Alta Calidad", price: "A: $299.99", oldPrice: "De: $450.00", sku: "SKU: 125680", image: "https://images.unsplash.com/photo-1507842217343-583f20270319?w=600&h=500&fit=crop", bg: "linear-gradient(180deg, #E8C9B8 0%, #DEC0AB 100%)", badge: "STOCK LIMITADO", description: "Vigencia del 1 al 31 de enero de 2026.", icon: "📓" },
    { id: 5, title: "Set de Marcadores Artísticos", subtitle: "72 Colores Premium", price: "A: $899.99", oldPrice: "De: $1,299.00", sku: "SKU: 456789", image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=500&fit=crop", bg: "linear-gradient(180deg, #F0D9C0 0%, #E8D0B5 100%)", badge: "HASTA -30%", description: "Para diseño y arte profesional.", icon: "🖍️" },
    { id: 6, title: "Papel Bond Premium", subtitle: "Resma de 500 hojas", price: "A: $79.99", oldPrice: "De: $120.00", sku: "SKU: 987654", image: "https://images.unsplash.com/photo-1542062692-9adcc1b3c2f7?w=600&h=500&fit=crop", bg: "linear-gradient(180deg, #B8E6D5 0%, #F0D9C0 100%)", badge: "OFERTA", description: "Para impresoras e impresoras láser.", icon: "📄" },
    { id: 7, title: "Estuche Completo para Artistas", subtitle: "Todo lo que necesitas en un set", price: "A: $1,299.99", oldPrice: "De: $1,899.00", sku: "SKU: 543210", image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=500&fit=crop", bg: "linear-gradient(180deg, #A8E6E1 0%, #F4DCC9 100%)", badge: "PROMOCIÓN", description: "Incluye lápices, marcadores y más.", icon: "🎨" },
]

export function Carusel({ type = "offers", bannerSlides = [] }: CarouselProps) {
    const navigate = useNavigate()
    const [currentIndex, setCurrentIndex] = useState(0)
    const [animating, setAnimating] = useState(false)
    const [direction, setDirection] = useState(0)
    // Hook para detectar si es dispositivo móvil (breakpoint por defecto 768px)
    const isMobile = useIsMobile()
    // Referencia del carousel para eventos táctiles
    const carouselRef = useTouchCarousel({
        onSwipeLeft: () => moveCarousel(1),
        onSwipeRight: () => moveCarousel(-1),
        minSwipeDistance: 50,
    })

    const offers = [
        { id: 1, icon: "🏢", title: "Ofertas de Oficina", subtitle: "Artículos esenciales para tu oficina", badge: "-30%" },
        { id: 2, icon: "🎁", title: "Ofertas en Regalos", subtitle: "Sets especiales de regalo para ocasiones", badge: "-25%" },
        { id: 3, icon: "📚", title: "Útiles Escolares", subtitle: "Imprescindibles para tu regreso a clases", badge: "-20%" },
    ]
    const bannerOffers = bannerSlides.length > 0 ? bannerSlides : defaultBannerOffers
    const totalItems = type === "banner" ? bannerOffers.length : offers.length

    // Autoplay: banner siempre; ofertas/products solo en desktop (en móvil sin auto)
    useEffect(() => {
        if (totalItems <= 1) return
        if (type === "banner") {
            const interval = setInterval(() => moveCarousel(1), isMobile ? 4000 : 5000)
            return () => clearInterval(interval)
        }
        if (!isMobile) {
            const interval = setInterval(() => moveCarousel(1), 5000)
            return () => clearInterval(interval)
        }
    }, [currentIndex, animating, isMobile, type, totalItems])

    const moveCarousel = (dir: number) => {
        if (animating) return
        setDirection(dir)
        setAnimating(true)
        setTimeout(() => {
            let newIndex = currentIndex + dir
            if (newIndex < 0) newIndex = totalItems - 1
            if (newIndex >= totalItems) newIndex = 0
            setCurrentIndex(newIndex)
            setAnimating(false)
        }, 400)
    }

    if (type === "banner") {
        const offer = bannerOffers[currentIndex]
        if (!offer) return null
        let directionClass = ""
        if (direction === 1) directionClass = " slide-left"
        else if (direction === -1) directionClass = " slide-right"
        const slideClassName = `fusion-slide${animating ? " animating" : ""}${directionClass}`
        const handleBannerClick = () => navigate(offer.redirectPath ?? "/all-products")
        return (
            // Contenedor con referencia para eventos táctiles
            <div
                ref={carouselRef}
                className="carousel-container carousel-banner fusion-carousel"
                style={{
                    maxWidth: "98vw",
                    position: "relative",
                    background: offer.fullImage
                        ? "linear-gradient(180deg, #eff4f6 0%, #e6edf0 100%)"
                        : (offer.bg ?? "linear-gradient(180deg, #B8D8E8 0%, #A8CDE0 100%)"),
                }}
            >
                {/* Botón anterior - oculto en móvil */}
                {!isMobile && (
                    <button
                        className="carousel-btn prev-btn fusion-arrow"
                        style={{ left: 24 }}
                        onClick={() => moveCarousel(-1)}
                        aria-label="Diapositiva anterior"
                    >
                        <i className="fas fa-chevron-left" />
                    </button>
                )}
                <div className="carousel-wrapper fusion-carousel-wrapper" style={{ background: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className={slideClassName} style={{ background: "none", boxShadow: "none", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} onClick={handleBannerClick} onKeyDown={(e) => e.key === "Enter" && handleBannerClick()} role="button" tabIndex={0}>
                        {offer.fullImage ? (
                            <div className="fusion-slide-full-wrap">
                                <img src={offer.image} alt={offer.title} className="fusion-slide-full-image" />
                            </div>
                        ) : (
                            <div className="fusion-slide-content" style={{ background: "none", boxShadow: "none", borderRadius: 0, width: "100%", maxWidth: 1400, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "40px 60px", gap: 40 }}>
                                <div className="fusion-slide-text">
                                    {offer.badge && <div className="offer-badge fusion-badge">{offer.badge}</div>}
                                    <h2>{offer.title}</h2>
                                    <p className="banner-card-subtitle">{offer.subtitle}</p>
                                    <div className="banner-card-discount">{offer.price}</div>
                                    {offer.oldPrice && <div className="banner-card-oldprice fusion-oldprice">{offer.oldPrice}</div>}
                                    {offer.sku && <div className="banner-card-sku fusion-sku">{offer.sku}</div>}
                                    <p className="banner-card-description">{offer.description}</p>
                                </div>
                                {offer.image ? <img src={offer.image} alt={offer.title} className="fusion-slide-img" /> : <div className="banner-card-graphic" style={{ fontSize: 180, opacity: 0.8 }}>{offer.icon}</div>}
                            </div>
                        )}
                    </div>
                </div>
                {/* Botón siguiente - oculto en móvil */}
                {!isMobile && (
                    <button
                        className="carousel-btn next-btn fusion-arrow"
                        style={{ right: 24 }}
                        onClick={() => moveCarousel(1)}
                        aria-label="Siguiente diapositiva"
                    >
                        <i className="fas fa-chevron-right" />
                    </button>
                )}
            </div>
        )
    }

    return (
        // Contenedor con referencia para eventos táctiles
        <div ref={carouselRef} className="carousel-container">
            {/* Botón anterior - oculto en móvil */}
            {!isMobile && (
                <button
                    className="carousel-btn prev-btn"
                    onClick={() => moveCarousel(-1)}
                    aria-label="Oferta anterior"
                >
                    <i className="fas fa-chevron-left" />
                </button>
            )}
            <div className="carousel-wrapper">
                <div className="carousel-track" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                    {offers.map((offer) => (
                        <div key={offer.id} className="offer-card">
                            <div className="offer-badge">{offer.badge}</div>
                            <div className="offer-icon">{offer.icon}</div>
                            <h3>{offer.title}</h3>
                            <p className="offer-subtitle">{offer.subtitle}</p>
                            <button type="button" className="btn-offer">
                                Ver Ofertas
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            {/* Botón siguiente - oculto en móvil */}
            {!isMobile && (
                <button
                    className="carousel-btn next-btn"
                    onClick={() => moveCarousel(1)}
                    aria-label="Siguiente oferta"
                >
                    <i className="fas fa-chevron-right" />
                </button>
            )}
        </div>
    )
}
