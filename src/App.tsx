import { Route, Routes, useLocation } from "react-router";
import { FloatingWhatsAppButton, Footer, Navbar } from "./components/layout";
import { AllProducts, Cart, Home, Login, ProductDetail, SignUp } from "./pages";

function App() {
  const location = useLocation();
  
  // No mostrar navbar y footer en login y signup
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
    </>
  )
}

export default App
