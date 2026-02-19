/**
 * Pantalla de acceso al panel de administración.
 *
 * Qué hace:
 * - Recibe la contraseña del admin.
 * - Llama al endpoint PHP de login (`/admin/auth/login.php`) vía adminApi.ts.
 * - Si el login es correcto, guarda token en localStorage y redirige a /admin.
 *
 * Datos guardados en localStorage:
 * - adminToken: token devuelto por backend (usado por rutas protegidas).
 * - isAdmin: bandera legacy para compatibilidad con partes previas del panel.
 * - adminMode: "api" para indicar que el acceso fue validado por backend.
 */
import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { adminLoginRequest } from "../services/adminApi";

export function AdminLogin() {
  // Estado del formulario y feedback visual.
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Si ya existe token, evita mostrar login y manda directo al dashboard.
    const hasToken = localStorage.getItem("adminToken");
    if (hasToken) {
      navigate("/admin", { replace: true });
    }
  }, [navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // Login contra backend PHP.
      const result = await adminLoginRequest(password);

      if (!result.ok || !result.token) {
        setError(result.message ?? "No se pudo iniciar sesión.");
        setIsSubmitting(false);
        return;
      }

      localStorage.setItem("adminToken", result.token);
      localStorage.setItem("isAdmin", "true");
      localStorage.setItem("adminMode", "api");
      navigate("/admin", { replace: true });
    } catch (loginError) {
      console.error(loginError);
      // Mensaje específico para errores de red/CORS.
      if (loginError instanceof Error && loginError.message.toLowerCase().includes("fetch")) {
        setError("No se pudo conectar con la API. Revisa URL, CORS y archivos PHP en Hostinger.");
      } else {
        setError("Ocurrió un error inesperado al intentar iniciar sesión.");
      }
      setIsSubmitting(false);
    }
  }

  return (
    <div className="admin-auth-page">
      <div className="admin-auth-card">
        <div className="admin-auth-brand">
          <span className="admin-badge admin-badge--login">God Art</span>
          <p className="admin-auth-kicker">Acceso interno</p>
        </div>

        <h1 className="admin-auth-title">Panel de administración</h1>
        <p className="admin-auth-subtitle">
          Acceso exclusivo para personal autorizado.
        </p>

        <form onSubmit={handleSubmit} className="admin-auth-form">
          <label className="admin-auth-label">
            <span>Clave de administrador</span>
            <div className="admin-auth-password-wrap">
              <input
                type={isPasswordVisible ? "text" : "password"}
                className="admin-auth-input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Introduce tu clave secreta"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="admin-auth-password-toggle"
                onClick={() => setIsPasswordVisible((prevValue) => !prevValue)}
              >
                {isPasswordVisible ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </label>

          {error && <p className="admin-auth-error">{error}</p>}

          <button type="submit" className="admin-auth-button" disabled={isSubmitting}>
            {isSubmitting ? "Entrando..." : "Entrar al panel"}
          </button>
        </form>

        <p className="admin-auth-footer-note">
          Si hay problemas de acceso, contactar al administrador del sistema.
        </p>
      </div>
    </div>
  );
}

