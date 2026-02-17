/**
 * Raíz de la aplicación God Art.
 * Define rutas, layout global (Navbar, Footer, botón WhatsApp, nav móvil) y
 * comportamiento de scroll al cambiar de página. Oculta header/footer en login y signup.
 */
import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router";
import { FloatingWhatsAppButton, Footer, MobileBottomNav, Navbar } from "./components/layout";
import { AllProducts, AdminDashboard, AdminLogin, Cart, Home, Login, ProductDetail, SignUp } from "./pages";
import { AdminRoute } from "./components/admin/AdminRoute";

function App() {
  const location = useLocation();

  /** Scroll al inicio en cada cambio de ruta (evita heredar posición de la página anterior). */
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const hideLayout =
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname.startsWith("/admin");

  return (
    <>
      {!hideLayout && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/all-products" element={<AllProducts />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Routes>
      {!hideLayout && <FloatingWhatsAppButton />}
      {!hideLayout && <Footer />}
      {!hideLayout && <MobileBottomNav />}
    </>
  )
}

export default App
