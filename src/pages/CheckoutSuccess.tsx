import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { getOrderBySessionId } from "../services/customerApi";
import { getStoreUserToken } from "../utils/storeSession";
import { clearCart } from "../utils/checkoutSuccess";
import type { OrderResponse } from "../services/customerApi";
import "../styles/cart.css";

/**
 * Página mostrada tras completar el pago en Stripe.
 * Limpia el carrito, opcionalmente carga el pedido por session_id y muestra recogida en tienda.
 */
export function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [orderLoading, setOrderLoading] = useState(!!sessionId);

  useEffect(() => {
    clearCart();
  }, []);

  useEffect(() => {
    if (!sessionId) {
      setOrderLoading(false);
      return;
    }
    const token = getStoreUserToken();
    if (!token) {
      setOrderLoading(false);
      return;
    }
    getOrderBySessionId(token, sessionId)
      .then((res) => {
        if (res.ok && res.order) setOrder(res.order);
      })
      .finally(() => setOrderLoading(false));
  }, [sessionId]);

  return (
    <main className="cart-main">
      <div className="cart-empty-container checkout-result-card">
        <div className="empty-message">
          <h2>¡Gracias por tu compra!</h2>
          <p>Tu pago se ha procesado correctamente.</p>

          {orderLoading && <p className="checkout-loading">Cargando detalle del pedido…</p>}
          {!orderLoading && order && (
            <div className="checkout-order-info">
              <p className="checkout-order-number">
                <strong>Pedido #{order.id}</strong>
                {order.total != null && (
                  <span className="checkout-order-total"> — ${order.total.toFixed(2)} MXN</span>
                )}
              </p>
              <p className="checkout-pickup-message">
                <i className="fas fa-store" aria-hidden /> Recoge tu pedido en nuestra tienda física. No hay envíos.
              </p>
              <p className="checkout-order-hint">
                Guarda este número de pedido para recoger: <strong>#{order.id}</strong>
              </p>
            </div>
          )}
          {!orderLoading && !order && sessionId && (
            <p className="checkout-session-hint">
              Código de confirmación: <code>{sessionId.slice(0, 24)}…</code>
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
