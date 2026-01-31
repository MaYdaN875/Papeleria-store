import { Route, Routes } from "react-router"
import { FloatingWhatsAppButton } from "./components/FloatingWhatsAppButton"
import { Footer } from "./components/Footer"
import { Navbar } from "./components/Navbar"
import { AllProducts, Cart, Home, ProductDetail } from "./pages"



function App() {


  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/all-products" element={<AllProducts />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
      </Routes>
      <FloatingWhatsAppButton />
      <Footer />
    </>
  )
}

export default App
