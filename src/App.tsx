/**
 * Raíz de la aplicación God Art.
 * Define rutas, layout global (Navbar, Footer, botón WhatsApp, nav móvil) y
 * comportamiento de scroll al cambiar de página.
 *
 * Nota sobre admin:
 * - El panel usa rutas /admin/*
 * - En esas rutas se ocultan layout público y navegación de tienda
 * - La protección real de acceso se delega en AdminRoute + backend PHP
 */
import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router";
import { FloatingWhatsAppButton, Footer, MobileBottomNav, Navbar } from "./components/layout";
import { AllProducts, AdminDashboard, AdminLogin, Cart, Home, Login, ProductDetail, SignUp } from "./pages";
import { AdminRoute } from "./components/admin/AdminRoute";

function App() {
  const location = useLocation();

  /** Evita que el navegador restaure scroll al recargar (queremos iniciar arriba siempre). */
  useEffect(() => {
    if (!("scrollRestoration" in globalThis.history)) return;

    const previousScrollRestoration = globalThis.history.scrollRestoration;
    globalThis.history.scrollRestoration = "manual";
    return () => {
      globalThis.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  /** Scroll al inicio en cada cambio de ruta (evita heredar posición de la página anterior). */
  useEffect(() => {
    // Doble ajuste para evitar que algunos navegadores reapliquen posición guardada al recargar.
    globalThis.scrollTo(0, 0);
    const scrollResetTimeout = globalThis.setTimeout(() => globalThis.scrollTo(0, 0), 0);
    return () => globalThis.clearTimeout(scrollResetTimeout);
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
