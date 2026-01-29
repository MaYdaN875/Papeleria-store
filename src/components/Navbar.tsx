import { smoothScroll } from "../utils/SmoothScroll"


export const Navbar = () => {
    return (
        <header className="header">
            <div className="header-container">
                {/* Logo de la papelería a la izquierda */}
                <a href="/" className="header-logo" onClick={() => smoothScroll('inicio')} >
                    <div className="logo-icon">📚</div>
                    <h1>PaperHub</h1>
                </a>


                <div className="header-search">
                    <div className="search-box">
                        <i className="fas fa-search"></i>
                        <input type="text" placeholder="Buscar productos, marcas..." id="searchInput" />
                    </div>
                </div>

                {/* Sección derecha: botón llamar a la locación, contacto y carrito */}
                <div className="header-right">
                    {/* Botón "Llamar a la locación" */}
                    <button className="btn-cta">Contactar</button>

                    {/* Icono del carrito que lleva a la página de carrito */}
                    <a href="/cart" className="cart-icon">
                        <i className="fas fa-shopping-cart"></i>
                        <span className="cart-count" id="cartCount">0</span>
                    </a>
                </div>
            </div>

            {/* NAVEGACIÓN DE CATEGORÍAS ============ */}
            {/* Menú horizontal con las 4 categorías principales */}
            <nav className="navbar">
                <div className="navbar-container">
                    <button type="button" className="category-link">
                        <i className="fas fa-book"></i> Útiles Escolares
                    </button>
                    <button type="button" className="category-link">
                        <i className="fas fa-pencil-alt"></i> Escritura
                    </button>
                    <button type="button" className="category-link">
                        <i className="fas fa-file"></i> Papelería
                    </button>
                    <button type="button" className="category-link">
                        <i className="fas fa-palette"></i> Arte & Manualidades
                    </button>
                </div>
            </nav>
        </header>
    )
}

