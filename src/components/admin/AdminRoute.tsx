/**
 * Ruta protegida para el panel de administración.
 *
 * Flujo:
 * 1) AdminLogin guarda "adminToken" en localStorage tras login correcto.
 * 2) Esta ruta revisa ese token.
 * 3) Si no existe, redirige a /admin/login.
 *
 * IMPORTANTE:
 * - Esto protege navegación en frontend, pero NO reemplaza seguridad backend.
 * - Los endpoints PHP deben validar sesión/token en producción.
 */
import { Navigate, Outlet } from "react-router";

export function AdminRoute() {
  const hasToken = globalThis.window?.localStorage?.getItem("adminToken");

  if (!hasToken) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}

