/**
 * Pantalla de acceso al panel de administración.
 *
 * Qué hace:
 * - Recibe usuario/correo y contraseña del admin.
 * - Llama al endpoint PHP de login (`/admin/auth/login.php`) vía adminApi.ts.
 * - Si el login es correcto, guarda token en sessionStorage y redirige a /admin.
 *
 * Datos guardados en sessionStorage:
 * - adminToken: token devuelto por backend (usado por rutas protegidas).
 * - adminMode: "api" para indicar que el acceso fue validado por backend.
 * - adminUser: identificador del usuario autenticado.
 */
import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { adminLoginRequest } from "../services/adminApi";
import { getAdminToken, setAdminSession } from "../utils/adminSession";

export function AdminLogin() {
  // Estado del formulario y feedback visual.
  const [userIdentifier, setUserIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Si ya existe token, evita mostrar login y manda directo al dashboard.
    const hasToken = getAdminToken();
    if (hasToken) {
      navigate("/admin", { replace: true });
    }
  }, [navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    const normalizedUserIdentifier = userIdentifier.trim();
    if (!normalizedUserIdentifier) {
      setError("El usuario o correo es obligatorio.");
      setIsSubmitting(false);
      return;
    }

    try {
      // Login contra backend PHP.
      const result = await adminLoginRequest(normalizedUserIdentifier, password);

      if (!result.ok || !result.token) {
        setError(result.message ?? "No se pudo iniciar sesión.");
        setIsSubmitting(false);
        return;
      }

      setAdminSession(result.token, normalizedUserIdentifier);
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
          <span className="admin-badge admin-badge--login">
            <img
              src="/godart-logo.png"
              alt="God Art"
              style={{ height: 32, display: "block" }}
            />
          </span>
          <p className="admin-auth-kicker">Acceso interno</p>
        </div>

        <h1 className="admin-auth-title">Panel de administración</h1>
        <p className="admin-auth-subtitle">
          Acceso exclusivo para personal autorizado.
        </p>

        <form onSubmit={handleSubmit} className="admin-auth-form">
          <label className="admin-auth-label">
            <span>Usuario</span>
            <input
              type="text"
              className="admin-auth-input"
              value={userIdentifier}
              onChange={(event) => setUserIdentifier(event.target.value)}
              placeholder="Tu nombre de usuario"
              autoComplete="off"
            />
          </label>

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

