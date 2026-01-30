import { useEffect } from "react"
import { useNavigate } from "react-router"
import { Carusel } from "../components/Carusel"
import { ProductCard } from "../components/ProductCard"
import { products } from "../data/products"
import { addProductToCart, syncCartCount } from "../utils/cart"

/* ================================
   COMPONENTE: Home
   Página principal con ofertas y productos destacados
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

export const Home = () => {
    const navigate = useNavigate()

    useEffect(() => {
        syncCartCount()
    }, [])

    const featuredProducts = products.filter((p) => FEATURED_IDS.includes(p.id))

    return (
        <>
            <section id="inicio" className="banner-principal">
                <Carusel type="banner" />
            </section>

            <section className="products-section">
                <h2 className="section-title">Productos Destacados</h2>
                <p className="section-subtitle">Los mejores artículos para tus necesidades</p>

                <div className="products-grid">
                    {featuredProducts.map((product) => {
                        const config = FEATURED_CONFIG[product.id]
                        return (
                            <ProductCard
                                key={product.id}
                                product={product}
                                badge={config?.badge}
                                originalPrice={config?.originalPrice}
                                brand={config?.brand}
                                rating={4.5}
                                onAddToCart={() =>
                                    addProductToCart(product.name, product.price.toFixed(2))
                                }
                            />
                        )
                    })}
                </div>

                <div className="see-more-container">
                    <button
                        type="button"
                        className="btn-see-more"
                        onClick={() => navigate("/all-products")}
                    >
                        <i className="fas fa-arrow-down" aria-hidden="true" /> Ver Más Productos
                    </button>
                </div>
            </section>
        </>
    )
}
