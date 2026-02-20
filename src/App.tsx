/**
 * Raíz de la aplicación God Art.
 * Define BrowserRouter, rutas, layout global (Navbar, Footer, botón WhatsApp, nav móvil)
 * y comportamiento de scroll al cambiar de página.
 *
 * Nota sobre admin:
 * - El panel usa rutas /admin/*
 * - En esas rutas se ocultan layout público y navegación de tienda
 * - La protección real de acceso se delega en AdminRoute + backend PHP
 */
import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import { FloatingWhatsAppButton, Footer, MobileBottomNav, Navbar } from "./components/layout";
import {
  AllProducts,
  AdminDashboard,
  AdminLogin,
  Cart,
  ForgotPassword,
  Home,
  Login,
  ProductDetail,
  ResetPassword,
  SignUp,
  VerifyEmail,
} from "./pages";
import { AdminRoute } from "./components/admin/AdminRoute";

function AppContent() {
  const location = useLocation();

  /** Evita que el navegador restaure scroll al recargar. */
  useEffect(() => {
    if (!("scrollRestoration" in globalThis.history)) return;
    const prev = globalThis.history.scrollRestoration;
    globalThis.history.scrollRestoration = "manual";
    return () => { globalThis.history.scrollRestoration = prev; };
  }, []);

  /** Scroll al inicio en cada cambio de ruta. */
  useEffect(() => {
    globalThis.scrollTo(0, 0);
    const t = globalThis.setTimeout(() => globalThis.scrollTo(0, 0), 0);
    return () => globalThis.clearTimeout(t);
  }, [location.pathname]);

  const hideLayout =
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname === "/forgot-password" ||
    location.pathname === "/reset-password" ||
    location.pathname === "/verify-email" ||
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
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Routes>
      {!hideLayout && <FloatingWhatsAppButton />}
      {!hideLayout && <Footer />}
      {!hideLayout && <MobileBottomNav />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
