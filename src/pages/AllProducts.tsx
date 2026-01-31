import { useEffect } from "react"
import { useNavigate } from "react-router"
import { products } from "../data/products"

/* ================================
   COMPONENTE: AllProducts
   Página completa con todos los productos y filtros por categoría
   ================================ */

export const AllProducts = () => {
    const navigate = useNavigate()

    // Hacer scroll al top cuando se carga la página
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    /* ================================
       FUNCIÓN: filterProducts
       Filtra los productos según la categoría seleccionada
       ================================ */
    const filterProducts = (category: string, evt: React.MouseEvent<HTMLButtonElement>) => {
        const productCards = document.querySelectorAll('.all-products-grid .product-card')
        const filterBtns = document.querySelectorAll('.filter-btn')
        
        filterBtns.forEach(btn => {
            btn.classList.remove('active')
        })
        ;(evt.target as HTMLButtonElement).classList.add('active')
        
        productCards.forEach(product => {
            const productCategory = (product as HTMLElement).dataset.category || ''
            if (category === 'todos' || productCategory.includes(category)) {
                product.classList.remove('hidden')
            } else {
                product.classList.add('hidden')
            }
        })
    }

    /* ================================
       FUNCIÓN: addProductToCart
       Agrega un producto al carrito
       ================================ */
    const addProductToCart = (productName: string, productPrice: string) => {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]')
        
        cart.push({
            name: productName,
            price: productPrice,
            id: Date.now()
        })
        
        localStorage.setItem('cart', JSON.stringify(cart))
        
        const cartCount = document.getElementById('cartCount')
        if (cartCount) {
            cartCount.textContent = cart.length.toString()
            cartCount.style.animation = 'none'
            setTimeout(() => {
                cartCount.style.animation = 'scaleIn 0.3s ease'
            }, 10)
        }
        
        // Disparar evento personalizado para que otros componentes se actualicen
        window.dispatchEvent(new Event('cartUpdated'))
        
        showNotification(productName + ' agregado al carrito!')
    }

    /* ================================
       FUNCIÓN: showNotification
       Muestra una notificación temporal
       ================================ */
    const showNotification = (message: string) => {
        const notification = document.createElement('div')
        notification.className = 'notification'
        notification.textContent = message
        
        document.body.appendChild(notification)
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease'
            setTimeout(() => {
                notification.remove()
            }, 300)
        }, 3000)
    }

    // Cargar contador del carrito
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const cartCount = document.getElementById('cartCount')
    if (cartCount) {
        cartCount.textContent = cart.length.toString()
    }

    return (
        <>
            {/* ============ HEADER CON BOTÓN DE VOLVER ============ */}
            <section className="all-products-header-container">
                <div className="header-content">
                    <button className="btn-back" onClick={() => navigate('/')}>
                        <i className="fas fa-arrow-left"></i> Volver
                    </button>
                    <div className="header-info">
                        <h1 className="page-title">Todos Nuestros Productos</h1>
                        <p className="page-subtitle">Explora nuestro catálogo completo por categoría</p>
                    </div>
                </div>
            </section>

            {/* ============ SECCIÓN DE TODOS LOS PRODUCTOS ============ */}
            <section className="all-products-section">
                <div className="products-layout-container">
                    {/* Filtros por categoría - Izquierda */}
                    <aside className="category-filters-sidebar">
                        <h3 className="sidebar-title">Categorías</h3>
                        <div className="category-filters-vertical">
                            <button className="filter-btn active" onClick={(e) => filterProducts('todos', e)}>
                                <i className="fas fa-th"></i> Todos
                            </button>
                            <button className="filter-btn" onClick={(e) => filterProducts('escolares', e)}>
                                <i className="fas fa-book"></i> Útiles Escolares
                            </button>
                            <button className="filter-btn" onClick={(e) => filterProducts('escritura', e)}>
                                <i className="fas fa-pencil-alt"></i> Escritura
                            </button>
                            <button className="filter-btn" onClick={(e) => filterProducts('papeleria', e)}>
                                <i className="fas fa-file"></i> Papelería
                            </button>
                            <button className="filter-btn" onClick={(e) => filterProducts('arte', e)}>
                                <i className="fas fa-palette"></i> Arte & Manualidades
                            </button>
                        </div>
                    </aside>

                    {/* Grid de productos - Derecha */}
                    <div className="products-content-area">
                        <div className="all-products-grid" id="allProductsGrid">
                            {products.map((product) => (
                                <div 
                                    key={product.id}
                                    className="product-card" 
                                    data-category={product.category.toLowerCase()} 
                                    onClick={() => navigate(`/product/${product.id}`)} 
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="product-image">
                                        <div className="product-placeholder">
                                            {product.id === 1 && '✒️'}
                                            {product.id === 2 && '📓'}
                                            {product.id === 3 && '🖍️'}
                                            {product.id === 4 && '✏️'}
                                            {product.id === 5 && '📄'}
                                            {product.id === 6 && '📁'}
                                            {product.id === 7 && '📚'}
                                            {product.id === 8 && '🎨'}
                                            {product.id === 9 && '🧹'}
                                            {product.id === 10 && '🎒'}
                                            {product.id === 11 && '🧴'}
                                            {product.id === 12 && '✍️'}
                                            {product.id === 13 && '🖌️'}
                                            {product.id === 14 && '🧹'}
                                            {product.id === 15 && '🖋️'}
                                            {product.id === 16 && '🎨'}
                                        </div>
                                        {product.id % 3 === 1 && <div className="product-badge discount">-20%</div>}
                                        {product.id % 3 === 2 && <div className="product-badge sale">HOT</div>}
                                        {product.id % 3 === 0 && <div className="product-badge discount">-15%</div>}
                                    </div>
                                    <div className="product-info">
                                        <h4>{product.name}</h4>
                                        <p className="product-brand">{product.description}</p>
                                        <div className="product-rating">
                                            {[...Array(5)].map((_, i) => (
                                                <i key={i} className="fas fa-star"></i>
                                            ))}
                                        </div>
                                        <div className="product-price">
                                            <span className="price-current">${product.price.toFixed(2)}</span>
                                        </div>
                                        <button className="btn-add-cart" onClick={(e) => {
                                            e.stopPropagation()
                                            addProductToCart(product.name, product.price.toFixed(2))
                                        }}>
                                            <i className="fas fa-shopping-cart"></i> Agregar al carrito
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ============ BOTÓN FLOTANTE WHATSAPP ============ */}
            <a href="https://wa.me/1234567890" className="whatsapp-btn" target="_blank" rel="noopener noreferrer" title="Contactanos por WhatsApp">
                <i className="fab fa-whatsapp"></i>
            </a>
        </>
    )
}
