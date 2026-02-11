import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import '../styles/login.css';

/**
 * Componente Login
 * 
 * Página de inicio de sesión con diseño responsivo pa no batallar en ningún dispositivo
 * Incluye formulario de email/contraseña y opciones de login social
 * Se adapta automáticamente a PC, tablets y móviles pa que este chido
 */
export const Login = () => {
  const navigate = useNavigate();
  
  // Estado del formulario - almacena los datos que escribe el usuario
  const [formData, setFormData] = useState({
    email: '',           // Almacena el email del usuario
    password: '',        // Almacena la contraseña del usuario
    rememberMe: false,   // Checkbox para recordar la sesión
  });

  /**
   * Scroll al top cuando el componente monta
   * Asegura que siempre veas el login desde arriba
   */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  /**
   * Maneja el click en el botón Volver al inicio
   * Navega al home y hace scroll al top de la página
   */
  const handleBackToHome = () => {
    console.log('Botón Volver al inicio clickeado');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate('/');
  };

  /**
   * Maneja los cambios en los inputs del formulario
   * Actualiza el estado con los valores ingresados
   * @param {Event} e - Evento del input
   */
  const handleInputChange = (e: { target: HTMLInputElement }) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      // Si es checkbox, usa el valor checked; si no, usa el text value
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  /**
   * Maneja el envío del formulario
   * Aquí iría la lógica para enviar los datos al servidor
   * @param {Event} e - Evento del formulario
   */
  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault(); // Previene la recarga de la página
    // Aquí iría la lógica de login real
    console.log('Login data:', formData);
  };

  return (
    <div className="login-container">
      {/* Contenedor principal del login */}
      <div className="login-wrapper">
        
        {/* SECCIÓN VISUAL IZQUIERDA - Solo visible en desktop */}
        {/* Contiene el branding, descripción y beneficios del login */}
        <div className="login-visual">
          <div className="login-visual-content">
            {/* Botón para volver al inicio */}
            <button type="button" className="back-to-home-btn" onClick={handleBackToHome}>
              <span>←</span> Volver al inicio
            </button>

            <h1>Bienvenido de vuelta</h1>
            <p>Accede a tu cuenta para ver tus pedidos y disfrutar de ofertas exclusivas</p>
            
            {/* Listado de características/beneficios */}
            <div className="login-visual-features">
              <div className="feature-item">
                <span className="feature-icon">📦</span>
                <p>Gestiona tus pedidos</p>
              </div>
              <div className="feature-item">
                <span className="feature-icon">💰</span>
                <p>Ofertas exclusivas</p>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⭐</span>
                <p>Historial de compras</p>
              </div>
            </div>
            
            {/* Elementos decorativos animados */}
            <div className="login-visual-decoration">
              <div className="shape shape-1"></div>
              <div className="shape shape-2"></div>
              <div className="shape shape-3"></div>
            </div>
          </div>
        </div>

        {/* SECCIÓN DEL FORMULARIO - Lado derecho */}
        {/* Contiene el formulario de login y al ir responsivo se pone encima del visual */}
        <div className="login-form-section">
          <div className="login-form-content">
            {/* Cabecera del formulario */}
            <div className="login-header">
              <h2>Iniciar Sesión</h2>
              <p>Accede a tu cuenta de papelería</p>
            </div>

            {/* Formulario principal */}
            <form className="login-form" onSubmit={handleSubmit}>
              
              {/* Campo de Email */}
              <div className="form-group">
                <label htmlFor="email">Correo electrónico</label>
                <div className="input-wrapper">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="tu@correo.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                  <span className="input-icon">✉️</span>
                </div>
              </div>

              {/* Campo de Contraseña */}
              <div className="form-group">
                <label htmlFor="password">Contraseña</label>
                <div className="input-wrapper">
                  <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="Tu contraseña"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                  <span className="input-icon">🔒</span>
                </div>
              </div>

              {/* Opciones: Recordarme y Olvidé contraseña */}
              <div className="form-options">
                {/* Checkbox para recordar sesión */}
                <label className="remember-me">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                  />
                  <span>Recuérdame</span>
                </label>
                {/* Botón para recuperar contraseña */}
                <button type="button" className="forgot-password-btn">¿Olvidaste tu contraseña?</button>
              </div>

              {/* Botón de Submit */}
              <button type="submit" className="login-btn">
                Iniciar Sesión
              </button>
            </form>

            {/* Línea divisoria con texto "O continúa con" */}
            <div className="divider">
              <span>O continúa con</span>
            </div>

            {/* Botones de login social (Google y Facebook) */}
            <div className="social-login">
              <button type="button" className="social-btn google-btn">
                <span>Google</span>
              </button>
              <button type="button" className="social-btn facebook-btn">
                <span>Facebook</span>
              </button>
            </div>

            {/* Enlace para ir a la página de registro */}
            <div className="signup-prompt">
              <p>¿No tienes cuenta? <Link to="/signup" className="signup-link">Regístrate</Link></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
