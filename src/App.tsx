import { Route, Routes } from "react-router"
import { Navbar } from "./components/Navbar"
import { AllProducts, Cart, Home, ProductDetail } from "./pages"
import { FloatingWhatsAppButton } from "./components/FloatingWhatsAppButton"



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
    </>
  )
}

export default App
