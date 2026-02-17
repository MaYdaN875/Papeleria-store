/**
 * Ruta protegida para el panel de administración.
 * Por ahora usa localStorage para simular una sesión de admin.
 * IMPORTANTE: Esto es solo para demo; no es seguridad real.
 */
import { Navigate, Outlet } from "react-router";

export function AdminRoute() {
  const hasToken = globalThis.window?.localStorage?.getItem("adminToken");

  if (!hasToken) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}

