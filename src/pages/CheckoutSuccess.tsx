import { useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { clearCart } from "../utils/checkoutSuccess";
import "../styles/cart.css";

/**
 * Página mostrada tras completar el pago en Stripe.
 * Limpia el carrito actual y muestra mensaje de agradecimiento.
 */
export function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    clearCart();
  }, []);

  return (
    <main className="cart-main">
      <div className="cart-empty-container checkout-result-card">
        <div className="empty-message">
          <h2>¡Gracias por tu compra!</h2>
          <p>Tu pago se ha procesado correctamente.</p>
          {sessionId && (
            <p className="checkout-session-hint">
              Número de sesión: <code>{sessionId.slice(0, 20)}…</code>
            </p>
          )}
        </div>
        <div className="checkout-result-actions">
          <Link to="/" className="btn-return">
            Volver a la tienda
          </Link>
          <Link to="/all-products" className="btn-continue" style={{ marginTop: 12 }}>
            Seguir comprando
          </Link>
        </div>
      </div>
    </main>
  );
}
