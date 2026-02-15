/**
 * Raíz de la aplicación God Art.
 * Define rutas, layout global (Navbar, Footer, botón WhatsApp, nav móvil) y
 * comportamiento de scroll al cambiar de página. Oculta header/footer en login y signup.
 */
import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router";
import { FloatingWhatsAppButton, Footer, MobileBottomNav, Navbar } from "./components/layout";
import { AllProducts, Cart, Home, Login, ProductDetail, SignUp } from "./pages";

function App() {
  const location = useLocation();

  /** Scroll al inicio en cada cambio de ruta (evita heredar posición de la página anterior). */
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <>
      {!isAuthPage && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/all-products" element={<AllProducts />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
      {!isAuthPage && <FloatingWhatsAppButton />}
      {!isAuthPage && <Footer />}
      {!isAuthPage && <MobileBottomNav />}
    </>
  )
}

export default App
