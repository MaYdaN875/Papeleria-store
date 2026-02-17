import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { adminLoginRequest } from "../services/adminApi";

export function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
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
      if (loginError instanceof Error && loginError.message.toLowerCase().includes("fetch")) {
        setError("No se pudo conectar con la API. Revisa URL, CORS y archivos PHP en Hostinger.");
      } else {
        setError("Ocurrió un error inesperado al intentar iniciar sesión.");
      }
      setIsSubmitting(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("adminMode");
    setPassword("");
    setError("");
  }

  return (
    <div className="admin-auth-page">
      <div className="admin-auth-card">
        <h1 className="admin-auth-title">Panel de administración</h1>
        <p className="admin-auth-subtitle">
          Esta pantalla es solo para el equipo de God Art.
          Usa el backend PHP configurado en <code>VITE_API_URL</code>.
        </p>

        <form onSubmit={handleSubmit} className="admin-auth-form">
          <label className="admin-auth-label">
            <span>Clave de administrador</span>
            <input
              type="password"
              className="admin-auth-input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Introduce tu clave secreta"
              autoComplete="current-password"
            />
          </label>
          <p className="admin-auth-hint">Usuario fijo actual: <code>admin@godart.com</code></p>

          {error && <p className="admin-auth-error">{error}</p>}

          <button type="submit" className="admin-auth-button" disabled={isSubmitting}>
            {isSubmitting ? "Entrando..." : "Entrar al panel"}
          </button>

          <button
            type="button"
            className="admin-auth-secondary-button"
            onClick={handleLogout}
          >
            Cerrar sesión local
          </button>
        </form>

        <p className="admin-auth-hint">
          Nota: este acceso usa ahora el backend PHP que configures en <code>VITE_API_URL</code>.
        </p>
      </div>
    </div>
  );
}

