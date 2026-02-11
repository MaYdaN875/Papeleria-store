import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import '../styles/signup.css';

/**
 * Componente SignUp / Registro
 * 
 * Página de registro con formulario completo y validación
 * Incluye campos de nombre, email, teléfono y contraseña
 * Con validación de contraseñas coincidentes y aceptación de términos
 * Diseño 100% responsivo para todos los dispositivos
 */
export const SignUp = () => {
  const navigate = useNavigate();
  
  // Estado del formulario - almacena todos los datos del registro
  const [formData, setFormData] = useState({
    firstName: '',        // Nombre del usuario
    lastName: '',         // Apellido del usuario
    email: '',            // Email del usuario
    password: '',         // Contraseña
    confirmPassword: '',  // Confirmación de contraseña
    phone: '',            // Teléfono (opcional)
    agreeTerms: false,    // Aceptación de términos y condiciones
  });
  
  // Estado para validar que las contraseñas coincidan
  const [passwordMatch, setPasswordMatch] = useState(true);

  /**
   * Scroll al top cuando el componente monta
   * Asegura que siempre veas el signup desde arriba
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
   * Actualiza los datos y valida que las contraseñas coincidan
   * @param {Event} e - Evento del input
   */
  const handleInputChange = (e: { target: HTMLInputElement }) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      // Si es checkbox, usa el valor checked; si no, usa el text value
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Validar que las contraseñas coincidan en tiempo real
    if (name === 'password' || name === 'confirmPassword') {
      const pass = name === 'password' ? value : formData.password;
      const confirm = name === 'confirmPassword' ? value : formData.confirmPassword;
      // Las contraseñas coinciden O el campo de confirmación está vacío (no mostrar error mientras escribe)
      setPasswordMatch(pass === confirm || confirm === '');
    }
  };

  /**
   * Maneja el envío del formulario
   * Valida que las contraseñas coincidan y que acepta términos
   * @param {Event} e - Evento del formulario
   */
  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault(); // Previene la recarga de la página
    
    // Validar que las contraseñas coincidan
    if (!passwordMatch) {
      alert('Las contraseñas no coinciden');
      return;
    }
    
    // Aquí iría la lógica de registro real
    console.log('Signup data:', formData);
  };

  return (
    <div className="signup-container">
      {/* Contenedor principal del registro */}
      <div className="signup-wrapper">
        
        {/* SECCIÓN VISUAL IZQUIERDA - Solo visible en desktop */}
        {/* Contiene el branding, descripción y beneficios del registro */}
        <div className="signup-visual">
          <div className="signup-visual-content">
            {/* Botón para volver al inicio */}
            <button type="button" className="back-to-home-btn" onClick={handleBackToHome}>
              <span>←</span> Volver al inicio
            </button>

            <h1>Únete a nuestra comunidad</h1>
            <p>Crea tu cuenta y disfruta de beneficios exclusivos</p>
            
            {/* Listado de beneficios de registrarse */}
            <div className="signup-visual-benefits">
              <div className="benefit-item">
                <span className="benefit-icon">🎁</span>
                <p>Descuentos y ofertas</p>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">🚚</span>
                <p>Envíos rápidos</p>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">💳</span>
                <p>Pagos seguros</p>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">📞</span>
                <p>Soporte 24/7</p>
              </div>
            </div>
            
            {/* Elementos decorativos animados */}
            <div className="signup-visual-decoration">
              <div className="shape shape-1"></div>
              <div className="shape shape-2"></div>
              <div className="shape shape-3"></div>
              <div className="shape shape-4"></div>
            </div>
          </div>
        </div>

        {/* SECCIÓN DEL FORMULARIO - Lado derecho */}
        {/* Contiene el formulario completo de registro */}
        <div className="signup-form-section">
          <div className="signup-form-content">
            
            {/* Cabecera del formulario */}
            <div className="signup-header">
              <h2>Crear Cuenta</h2>
              <p>Completa el formulario para registrarte</p>
            </div>

            {/* Formulario principal */}
            <form className="signup-form" onSubmit={handleSubmit}>
              
              {/* Fila con Nombre y Apellido lado a lado */}
              <div className="form-row">
                {/* Campo de Nombre */}
                <div className="form-group">
                  <label htmlFor="firstName">Nombre</label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      placeholder="Tu nombre"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                    <span className="input-icon">👤</span>
                  </div>
                </div>
                
                {/* Campo de Apellido */}
                <div className="form-group">
                  <label htmlFor="lastName">Apellido</label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      placeholder="Tu apellido"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                    <span className="input-icon">👤</span>
                  </div>
                </div>
              </div>

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

              {/* Campo de Teléfono (Opcional) */}
              <div className="form-group">
                <label htmlFor="phone">Teléfono (opcional)</label>
                <div className="input-wrapper">
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="+34 123 456 789"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                  <span className="input-icon">📱</span>
                </div>
              </div>

              {/* Fila con Contraseña y Confirmación lado a lado */}
              <div className="form-row">
                {/* Campo de Contraseña */}
                <div className="form-group">
                  <label htmlFor="password">Contraseña</label>
                  <div className="input-wrapper">
                    <input
                      type="password"
                      id="password"
                      name="password"
                      placeholder="Mínimo 8 caracteres"
                      value={formData.password}
                      onChange={handleInputChange}
                      minLength={8}
                      required
                    />
                    <span className="input-icon">🔒</span>
                  </div>
                </div>
                
                {/* Campo de Confirmación de Contraseña */}
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirmar contraseña</label>
                  <div className="input-wrapper">
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      placeholder="Repite tu contraseña"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      minLength={8}
                      required
                      // Añade clase 'error' si las contraseñas no coinciden
                      className={passwordMatch ? '' : 'error'}
                    />
                    <span className="input-icon">🔒</span>
                  </div>
                  {/* Muestra mensaje de error si las contraseñas no coinciden */}
                  {!passwordMatch && <span className="error-text">Las contraseñas no coinciden</span>}
                </div>
              </div>

              {/* Checkbox de aceptación de términos y condiciones */}
              <label className="terms-checkbox">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleInputChange}
                  required
                />
                <span>
                  Acepto los{' '}
                  <button type="button" className="terms-link">términos y condiciones</button>
                  {' '}y la{' '}
                  <button type="button" className="terms-link">política de privacidad</button>
                </span>
              </label>

              {/* Botón de Submit - Deshabilitado si las contraseñas no coinciden o no acepta términos */}
              <button 
                type="submit" 
                className="signup-btn" 
                disabled={!passwordMatch || !formData.agreeTerms}
              >
                Crear Cuenta
              </button>
            </form>

            {/* Línea divisoria con texto "O regístrate con" */}
            <div className="divider">
              <span>O regístrate con</span>
            </div>

            {/* Botones de registro social (Google y Facebook) */}
            <div className="social-signup">
              <button type="button" className="social-btn google-btn">
                <span>Google</span>
              </button>
              <button type="button" className="social-btn facebook-btn">
                <span>Facebook</span>
              </button>
            </div>

            {/* Enlace para ir a la página de login */}
            <div className="login-prompt">
              <p>¿Ya tienes cuenta? <Link to="/login" className="login-link">Inicia sesión</Link></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
