/**
 * Ruta protegida para el panel de administración.
 *
 * Flujo:
 * 1) AdminLogin guarda "adminToken" en sessionStorage tras login correcto.
 * 2) Esta ruta revisa ese token.
 * 3) Si no existe, redirige a /admin/login.
 *
 * IMPORTANTE:
 * - Esto protege navegación en frontend, pero NO reemplaza seguridad backend.
 * - Los endpoints PHP deben validar sesión/token en producción.
 */
import { Navigate, Outlet } from "react-router";
import { getAdminToken } from "../../utils/adminSession";

export function AdminRoute() {
  const hasToken = getAdminToken();

  if (!hasToken) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}

