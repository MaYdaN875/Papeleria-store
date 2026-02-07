import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router"
import {
    ProductDetailActions,
    ProductDetailImage,
    ProductDetailInfo,
    ProductDetailShipping,
} from "../components/product-detail"
import { getProductById } from "../data/products"
import { addProductToCart } from "../utils/cart"

/* ================================
   PÁGINA: ProductDetail
   Detalle de un producto individual.
   Orquesta ProductDetailImage, Info, Actions y Shipping.
   ================================ */

const ORIGINAL_PRICES: Record<number, number> = {
    1: 89.99,
    3: 120,
    4: 150,
    6: 55,
    8: 110,
}

export const ProductDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [quantity, setQuantity] = useState(1)

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [id])

    const product = getProductById(id ?? "")

    if (!product) {
        return (
            <main className="cart-main product-detail-not-found">
                <h2>Producto no encontrado</h2>
                <button
                    className="btn-return"
                    onClick={() => navigate("/")}
                >
                    Volver a la tienda
                </button>
            </main>
        )
    }

    const brand = product.description.split(" ")[0] ?? ""
    const originalPrice = ORIGINAL_PRICES[product.id]
    const rating = 4.5
    const reviews = Math.floor(product.stock * 3.5)

    const handleAddToCart = () => {
        addProductToCart(
            product.name,
            product.price.toFixed(2),
            quantity
        )
    }

    return (
        <main className="cart-main">
            <div className="product-detail-page">
                <button
                    className="btn-return"
                    onClick={() => navigate("/")}
                >
                    <i className="fas fa-arrow-left" aria-hidden />
                    Volver
                </button>

                <div className="product-detail__layout">
                    <ProductDetailImage product={product} />

                    <div>
                        <ProductDetailInfo
                            product={product}
                            brand={brand}
                            originalPrice={originalPrice}
                            rating={rating}
                            reviews={reviews}
                        />
                        <ProductDetailActions
                            product={product}
                            quantity={quantity}
                            onQuantityChange={setQuantity}
                            onAddToCart={handleAddToCart}
                        />
                        <ProductDetailShipping />
                    </div>
                </div>
            </div>
        </main>
    )
}
