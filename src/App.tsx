import { Route, Routes } from "react-router"
import { FloatingWhatsAppButton, Footer, Navbar } from "./components/layout"
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
