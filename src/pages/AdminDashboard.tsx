import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { fetchAdminProducts, type AdminProduct } from "../services/adminApi";

export function AdminDashboard() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminMode, setAdminMode] = useState<"api" | "unknown">("unknown");

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login", { replace: true });
      return;
    }
    const safeToken = token;

    async function loadProducts() {
      setIsLoading(true);
      setError("");
      const mode = localStorage.getItem("adminMode");
      if (mode === "api") {
        setAdminMode(mode);
      } else {
        setAdminMode("unknown");
      }

      try {
        const result = await fetchAdminProducts(safeToken);

        if (!result.ok || !result.products) {
          setError(result.message ?? "No se pudieron cargar los productos.");
          setIsLoading(false);
          return;
        }

        setProducts(result.products);
        setIsLoading(false);
      } catch (productsError) {
        console.error(productsError);
        setError("No se pudo conectar con la API de Hostinger para cargar productos.");
        setIsLoading(false);
      }
    }

    void loadProducts();
  }, [navigate]);

  function handleLogout() {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("adminMode");
    navigate("/admin/login", { replace: true });
  }

  function getSidebarStatusMessage() {
    if (adminMode === "api" && !error)
      return "Conectado a Hostinger: API PHP y base de datos MySQL activas.";

    if (error)
      return "No hay conexión con la API en este momento. Revisa Hostinger, dominio y CORS.";

    return "Estado de conexión en verificación...";
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <span className="admin-badge">God Art</span>
          <h2>Panel admin</h2>
          <p>Gestión interna de la papelería.</p>
        </div>

        <nav className="admin-sidebar-nav">
          <button
            type="button"
            className="admin-nav-item admin-nav-item--active"
          >
            Resumen
          </button>
          <button
            type="button"
            className="admin-nav-item"
            onClick={() => navigate("/")}
          >
            Ver tienda
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <button
            type="button"
            className="admin-logout-button"
            onClick={handleLogout}
          >
            Cerrar sesión admin
          </button>
          <p className="admin-sidebar-note">
            {getSidebarStatusMessage()}
          </p>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-main-header">
          <h1>Resumen general</h1>
          <p>
            Aquí podrás controlar el catálogo, banners y configuración de la
            página cuando el backend esté listo.
          </p>
        </header>

        <section className="admin-cards-grid">
          <article className="admin-card">
            <h2>Catálogo de productos</h2>
            <p className="admin-card-number">{products.length}</p>
            <p className="admin-card-description">
              Productos que vienen ahora de la base de datos del servidor.
            </p>
            <button
              type="button"
              className="admin-card-button"
              disabled
              title="Gestión completa pendiente de implementar (CRUD)"
            >
              Gestionar productos (próximamente)
            </button>
          </article>

          <article className="admin-card">
            <h2>Categorías (aprox.)</h2>
            <p className="admin-card-number">
              {new Set(products.map((product) => product.category)).size}
            </p>
            <p className="admin-card-description">
              Categorías calculadas a partir de los productos que llegan de la API.
            </p>
            <button
              type="button"
              className="admin-card-button"
              disabled
              title="Pendiente de conectar a backend"
            >
              Editar categorías (próximamente)
            </button>
          </article>

          <article className="admin-card">
            <h2>Banners y Home</h2>
            <p className="admin-card-number">Demo</p>
            <p className="admin-card-description">
              Aquí irán los controles para el carrusel, secciones de Home y
              productos destacados.
            </p>
            <button
              type="button"
              className="admin-card-button"
              disabled
              title="Pendiente de conectar a backend"
            >
              Configurar Home (próximamente)
            </button>
          </article>
        </section>

        <section className="admin-info-panel">
          <h2>Productos (vista rápida desde PHP/MySQL)</h2>
          {isLoading && <p>Cargando productos...</p>}
          {!isLoading && error && <p className="admin-auth-error">{error}</p>}
          {!isLoading && !error && products.length === 0 && (
            <p>No hay productos registrados en la base de datos.</p>
          )}
          {!isLoading && !error && products.length > 0 && (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Categoría</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Mayoreo</th>
                    <th>Menudeo</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.id}</td>
                      <td>{product.name}</td>
                      <td>{product.category}</td>
                      <td>${Number(product.price).toFixed(2)}</td>
                      <td>{product.stock}</td>
                      <td>{product.mayoreo ? "Sí" : "No"}</td>
                      <td>{product.menudeo ? "Sí" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

