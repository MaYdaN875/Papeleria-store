import { Link } from "react-router";
import "../styles/cart.css";

/**
 * Página mostrada si el usuario cancela el pago en Stripe (vuelve sin pagar).
 */
export function CheckoutCancel() {
  return (
    <main className="cart-main">
      <div className="cart-empty-container checkout-result-card">
        <div className="empty-message">
          <h2>Pago cancelado</h2>
          <p>No se realizó ningún cargo. Tu carrito sigue igual por si quieres intentar de nuevo.</p>
        </div>
        <div className="checkout-result-actions">
          <Link to="/cart" className="btn-return">
            Volver al carrito
          </Link>
          <Link to="/" className="btn-continue" style={{ marginTop: 12 }}>
            Ir a la tienda
          </Link>
        </div>
      </div>
    </main>
  );
}
