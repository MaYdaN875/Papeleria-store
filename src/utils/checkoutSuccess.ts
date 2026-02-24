/**
 * Limpia el carrito activo (todas las claves de carrito del usuario actual).
 * Se usa tras una compra exitosa para no dejar ítems ya comprados.
 */
import { getActiveCartStorageKey } from "./cart";

export function clearCart(): void {
  const key = getActiveCartStorageKey();
  globalThis.localStorage.removeItem(key);
  globalThis.dispatchEvent(new Event("cartUpdated"));
  globalThis.dispatchEvent(new Event("storage"));
}
