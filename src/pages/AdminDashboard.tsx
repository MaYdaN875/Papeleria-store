/**
 * Dashboard principal del panel admin.
 *
 * Responsabilidades:
 * - Verificar sesión local y cargar productos desde API PHP.
 * - Mostrar estado de conexión backend (Hostinger/MySQL).
 * - Permitir edición rápida de producto (nombre, precio, stock, mayoreo/menudeo).
 * - Persistir cambios usando admin_product_update.php.
 */
import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  adminLogoutRequest,
  createAdminProduct,
  deleteAdminProduct,
  fetchAdminCategories,
  fetchAdminProducts,
  type AdminCategory,
  type AdminProduct,
  updateAdminProduct,
} from "../services/adminApi";

interface ProductEditFormState {
  name: string;
  price: string;
  stock: string;
  mayoreo: boolean;
  menudeo: boolean;
}

interface ProductCreateFormState {
  name: string;
  categoryId: string;
  price: string;
  stock: string;
  mayoreo: boolean;
  menudeo: boolean;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  // Estado principal de datos del dashboard.
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [error, setError] = useState("");
  const [adminMode, setAdminMode] = useState<"api" | "unknown">("unknown");
  const [lastSyncAt, setLastSyncAt] = useState("");

  // Estado del formulario de edición de producto.
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [editForm, setEditForm] = useState<ProductEditFormState>({
    name: "",
    price: "",
    stock: "",
    mayoreo: true,
    menudeo: true,
  });
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [isDeletingProductId, setIsDeletingProductId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState("");
  const [createForm, setCreateForm] = useState<ProductCreateFormState>({
    name: "",
    categoryId: "",
    price: "",
    stock: "",
    mayoreo: true,
    menudeo: true,
  });

  useEffect(() => {
    // Si no hay token, bloquea acceso al dashboard.
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login", { replace: true });
      return;
    }
    const safeToken = token;

    async function loadProducts() {
      setIsLoading(true);
      setError("");

      // Modo guardado desde login (actualmente "api" cuando valida backend).
      const mode = localStorage.getItem("adminMode");
      if (mode === "api") {
        setAdminMode(mode);
      } else {
        setAdminMode("unknown");
      }

      try {
        // Carga de productos desde endpoint PHP.
        const result = await fetchAdminProducts(safeToken);

        if (!result.ok || !result.products) {
          setError(result.message ?? "No se pudieron cargar los productos.");
          setIsLoading(false);
          return;
        }

        setProducts(result.products);
        setLastSyncAt(
          new Date().toLocaleTimeString("es-MX", {
            hour: "2-digit",
            minute: "2-digit",
          })
        );
        setIsLoading(false);
      } catch (productsError) {
        console.error(productsError);
        // Error de red/CORS/API.
        setError("No se pudo conectar con la API de Hostinger para cargar productos.");
        setIsLoading(false);
      }
    }

    async function loadCategories() {
      setIsLoadingCategories(true);

      try {
        const result = await fetchAdminCategories(safeToken);
        if (!result.ok || !result.categories) {
          setError(result.message ?? "No se pudieron cargar las categorías.");
          setIsLoadingCategories(false);
          return;
        }

        const activeCategories = result.categories.filter((category) => category.isActive === 1);
        setCategories(activeCategories);
        setIsLoadingCategories(false);
      } catch (categoriesError) {
        console.error(categoriesError);
        setError("No se pudo conectar con la API de Hostinger para cargar categorías.");
        setIsLoadingCategories(false);
      }
    }

    void loadProducts();
    void loadCategories();
  }, [navigate]);

  useEffect(() => {
    if (!createForm.categoryId && categories.length > 0) {
      setCreateForm((prevForm) => ({
        ...prevForm,
        categoryId: String(categories[0]?.id ?? ""),
      }));
    }
  }, [categories, createForm.categoryId]);

  async function handleLogout() {
    // Cierre de sesión local: limpia token y estado admin.
    const token = localStorage.getItem("adminToken");
    if (token) {
      try {
        await adminLogoutRequest(token);
      } catch (logoutError) {
        console.error(logoutError);
      }
    }

    localStorage.removeItem("adminToken");
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("adminMode");
    navigate("/admin/login", { replace: true });
  }

  function startEditProduct(product: AdminProduct) {
    // Inicializa formulario con datos de la fila seleccionada.
    setEditingProductId(product.id);
    setEditError("");
    setEditSuccess("");
    setEditForm({
      name: product.name,
      price: String(product.price),
      stock: String(product.stock),
      mayoreo: product.mayoreo === 1,
      menudeo: product.menudeo === 1,
    });
  }

  function cancelEditProduct() {
    // Cierra formulario sin persistir cambios.
    setEditingProductId(null);
    setEditError("");
  }

  async function handleDeleteProduct(product: AdminProduct) {
    const shouldDelete = globalThis.confirm(
      `¿Seguro que quieres eliminar "${product.name}"?\n\nSe eliminará de forma permanente en la base de datos.`
    );
    if (!shouldDelete) return;

    setDeleteError("");
    setDeleteSuccess("");
    setIsDeletingProductId(product.id);

    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setDeleteError("Sesión no válida. Vuelve a iniciar sesión.");
        setIsDeletingProductId(null);
        return;
      }

      const result = await deleteAdminProduct({ id: product.id }, token);
      if (!result.ok || !result.deletedId) {
        setDeleteError(result.message ?? "No se pudo eliminar el producto.");
        setIsDeletingProductId(null);
        return;
      }

      setProducts((prevProducts) =>
        prevProducts.filter((currentProduct) => currentProduct.id !== result.deletedId)
      );

      if (editingProductId === result.deletedId) {
        setEditingProductId(null);
      }

      setDeleteSuccess("Producto eliminado correctamente.");
      setIsDeletingProductId(null);
    } catch (deleteProductError) {
      console.error(deleteProductError);
      setDeleteError("No se pudo conectar con la API para eliminar el producto.");
      setIsDeletingProductId(null);
    }
  }

  async function handleCreateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedCategoryId = Number(createForm.categoryId);
    const parsedPrice = Number(createForm.price);
    const parsedStock = Number(createForm.stock);

    if (!createForm.name.trim()) {
      setCreateError("El nombre del producto es obligatorio.");
      return;
    }

    if (!parsedCategoryId || parsedCategoryId <= 0) {
      setCreateError("Selecciona una categoría válida.");
      return;
    }

    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setCreateError("El precio debe ser un número válido mayor o igual a 0.");
      return;
    }

    if (!Number.isInteger(parsedStock) || parsedStock < 0) {
      setCreateError("El stock debe ser un número entero mayor o igual a 0.");
      return;
    }

    setIsCreatingProduct(true);
    setCreateError("");
    setCreateSuccess("");

    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setCreateError("Sesión no válida. Vuelve a iniciar sesión.");
        setIsCreatingProduct(false);
        return;
      }

      const result = await createAdminProduct({
        categoryId: parsedCategoryId,
        name: createForm.name.trim(),
        price: parsedPrice,
        stock: parsedStock,
        mayoreo: createForm.mayoreo ? 1 : 0,
        menudeo: createForm.menudeo ? 1 : 0,
      }, token);

      if (!result.ok || !result.product) {
        setCreateError(result.message ?? "No se pudo crear el producto.");
        setIsCreatingProduct(false);
        return;
      }

      const createdProduct = result.product;
      setProducts((prevProducts) => [createdProduct, ...prevProducts]);
      setCreateSuccess("Producto creado correctamente.");
      setCreateForm((prevForm) => ({
        ...prevForm,
        name: "",
        price: "",
        stock: "",
        mayoreo: true,
        menudeo: true,
      }));
      setIsCreatingProduct(false);
    } catch (createProductError) {
      console.error(createProductError);
      setCreateError("No se pudo conectar con la API para crear el producto.");
      setIsCreatingProduct(false);
    }
  }

  async function handleSaveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingProductId) return;

    // Validaciones básicas antes de enviar al backend.
    const parsedPrice = Number(editForm.price);
    const parsedStock = Number(editForm.stock);

    if (!editForm.name.trim()) {
      setEditError("El nombre del producto es obligatorio.");
      return;
    }

    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setEditError("El precio debe ser un número válido mayor o igual a 0.");
      return;
    }

    if (!Number.isInteger(parsedStock) || parsedStock < 0) {
      setEditError("El stock debe ser un número entero mayor o igual a 0.");
      return;
    }

    setIsSavingProduct(true);
    setEditError("");
    setEditSuccess("");

    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setEditError("Sesión no válida. Vuelve a iniciar sesión.");
        setIsSavingProduct(false);
        return;
      }

      // Persistencia real en MySQL mediante endpoint PHP.
      const result = await updateAdminProduct({
        id: editingProductId,
        name: editForm.name.trim(),
        price: parsedPrice,
        stock: parsedStock,
        mayoreo: editForm.mayoreo ? 1 : 0,
        menudeo: editForm.menudeo ? 1 : 0,
      }, token);

      if (!result.ok || !result.product) {
        setEditError(result.message ?? "No se pudo guardar el producto.");
        setIsSavingProduct(false);
        return;
      }

      const updatedProduct = result.product;
      // Refresca solo el producto editado en la tabla (sin recargar toda la página).
      setProducts((prevProducts) =>
        prevProducts.map((product) => (product.id === updatedProduct.id ? updatedProduct : product))
      );
      setEditSuccess("Producto actualizado correctamente.");
      setEditingProductId(null);
      setIsSavingProduct(false);
    } catch (saveError) {
      console.error(saveError);
      setEditError("No se pudo conectar con la API para guardar los cambios.");
      setIsSavingProduct(false);
    }
  }

  // Mensaje contextual en sidebar para saber si hay conexión real con backend.
  function getSidebarStatusMessage() {
    if (adminMode === "api" && !error)
      return "Conectado a Hostinger: API PHP y base de datos MySQL activas.";

    if (error)
      return "No hay conexión con la API en este momento. Revisa Hostinger, dominio y CORS.";

    return "Estado de conexión en verificación...";
  }

  const totalCategories = new Set(products.map((product) => product.category)).size;
  const lowStockCount = products.filter((product) => product.stock <= 5).length;
  const mayoreoEnabledCount = products.filter((product) => product.mayoreo === 1).length;

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
        <header className="admin-main-header admin-main-header--hero">
          <div className="admin-header-topline">
            <div>
              <span className="admin-header-eyebrow">Panel privado</span>
              <h1>Control de catálogo</h1>
              <p>
                El panel ya opera con backend seguro (sesión por token).
                Por petición del equipo, buscador/filtros por categoría quedan en pausa
                mientras se define la nueva estructura de categorías.
              </p>
            </div>
            <div className="admin-header-actions">
              <button
                type="button"
                className="admin-header-button admin-header-button--ghost"
                onClick={() => navigate("/")}
              >
                Ir a la tienda
              </button>
              <button
                type="button"
                className="admin-header-button"
                onClick={() => void handleLogout()}
              >
                Cerrar sesión
              </button>
            </div>
          </div>
          <div className="admin-status-chips">
            <span className="admin-status-chip admin-status-chip--ok">Seguridad backend activa</span>
            <span className="admin-status-chip">Categorías en revisión</span>
            <span className="admin-status-chip">Buscador y filtros pospuestos</span>
            {lastSyncAt && <span className="admin-status-chip">Sincronizado: {lastSyncAt}</span>}
          </div>
        </header>

        <section className="admin-cards-grid">
          <article className="admin-card">
            <h2>Catálogo de productos</h2>
            <p className="admin-card-number">{products.length}</p>
            <p className="admin-card-description">
              Productos activos sincronizados desde MySQL.
            </p>
            <p className="admin-card-note">Gestión completa disponible: crear, editar y eliminar.</p>
          </article>

          <article className="admin-card">
            <h2>Categorías detectadas</h2>
            <p className="admin-card-number">{totalCategories}</p>
            <p className="admin-card-description">
              Conteo temporal para referencia durante esta etapa.
            </p>
            <p className="admin-card-note">El módulo de categorías se ajustará después de cambios en la web principal.</p>
          </article>

          <article className="admin-card">
            <h2>Stock bajo</h2>
            <p className="admin-card-number">{lowStockCount}</p>
            <p className="admin-card-description">
              Productos con stock menor o igual a 5 unidades.
            </p>
            <p className="admin-card-note">Métrica visual para decisiones rápidas de inventario.</p>
          </article>

          <article className="admin-card">
            <h2>Mayoreo habilitado</h2>
            <p className="admin-card-number">{mayoreoEnabledCount}</p>
            <p className="admin-card-description">
              Productos que actualmente permiten compra por mayoreo.
            </p>
            <p className="admin-card-note">Este dato ayuda a validar estrategia comercial del catálogo.</p>
          </article>
        </section>

        <section className="admin-info-panel">
          <div className="admin-panel-header">
            <h2>Gestión de productos</h2>
            <p>
              Se mantiene foco en CRUD de productos.
              Buscador y filtros por categoría quedan pendientes hasta cerrar cambios de categorías.
            </p>
          </div>
          <form className="admin-create-form admin-surface-card" onSubmit={handleCreateProduct}>
            <h3>Crear producto</h3>

            <div className="admin-edit-grid">
              <label className="admin-edit-label">
                <span>Nombre</span>
                <input
                  className="admin-edit-input"
                  value={createForm.name}
                  onChange={(event) =>
                    setCreateForm((prevForm) => ({ ...prevForm, name: event.target.value }))
                  }
                />
              </label>

              <label className="admin-edit-label">
                <span>Categoría</span>
                <select
                  className="admin-edit-input"
                  value={createForm.categoryId}
                  onChange={(event) =>
                    setCreateForm((prevForm) => ({ ...prevForm, categoryId: event.target.value }))
                  }
                  disabled={isLoadingCategories || categories.length === 0}
                >
                  {categories.length === 0 && <option value="">Sin categorías</option>}
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name} (ID: {category.id})
                    </option>
                  ))}
                </select>
              </label>

              <label className="admin-edit-label">
                <span>Precio</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="admin-edit-input"
                  value={createForm.price}
                  onChange={(event) =>
                    setCreateForm((prevForm) => ({ ...prevForm, price: event.target.value }))
                  }
                />
              </label>

              <label className="admin-edit-label">
                <span>Stock</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="admin-edit-input"
                  value={createForm.stock}
                  onChange={(event) =>
                    setCreateForm((prevForm) => ({ ...prevForm, stock: event.target.value }))
                  }
                />
              </label>
            </div>

            <div className="admin-edit-checks">
              <label>
                <input
                  type="checkbox"
                  checked={createForm.mayoreo}
                  onChange={(event) =>
                    setCreateForm((prevForm) => ({ ...prevForm, mayoreo: event.target.checked }))
                  }
                />
                <span>Mayoreo</span>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={createForm.menudeo}
                  onChange={(event) =>
                    setCreateForm((prevForm) => ({ ...prevForm, menudeo: event.target.checked }))
                  }
                />
                <span>Menudeo</span>
              </label>
            </div>

            {createError && <p className="admin-auth-error">{createError}</p>}
            {createSuccess && <p className="admin-edit-success">{createSuccess}</p>}

            <div className="admin-edit-actions">
              <button
                type="submit"
                className="admin-row-action-button admin-row-action-button--save"
                disabled={isCreatingProduct || categories.length === 0}
              >
                {isCreatingProduct ? "Creando..." : "Crear producto"}
              </button>
            </div>
          </form>

          {isLoading && <p>Cargando productos...</p>}
          {!isLoading && error && <p className="admin-auth-error">{error}</p>}
          {!isLoading && !error && products.length === 0 && (
            <p>No hay productos registrados en la base de datos.</p>
          )}
          {!isLoading && !error && products.length > 0 && (
            <div className="admin-table-wrapper admin-surface-card">
              <div className="admin-table-toolbar">
                <p>{products.length} productos en catálogo</p>
                <p>Edición en línea activa</p>
              </div>
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
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.id}</td>
                      <td>{product.name}</td>
                      <td>{product.category}</td>
                      <td>${Number(product.price).toFixed(2)}</td>
                      <td>
                        <span
                          className={`admin-stock-pill ${
                            product.stock <= 5 ? "admin-stock-pill--low" : "admin-stock-pill--ok"
                          }`}
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`admin-flag ${
                            product.mayoreo ? "admin-flag--on" : "admin-flag--off"
                          }`}
                        >
                          {product.mayoreo ? "Activo" : "No"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`admin-flag ${
                            product.menudeo ? "admin-flag--on" : "admin-flag--off"
                          }`}
                        >
                          {product.menudeo ? "Activo" : "No"}
                        </span>
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="admin-row-action-button"
                            onClick={() => startEditProduct(product)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="admin-row-action-button admin-row-action-button--danger"
                            onClick={() => handleDeleteProduct(product)}
                            disabled={isDeletingProductId === product.id}
                          >
                            {isDeletingProductId === product.id ? "Eliminando..." : "Eliminar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {editingProductId && (
            <form className="admin-edit-form admin-surface-card" onSubmit={handleSaveProduct}>
              <h3>Editar producto ID {editingProductId}</h3>
              <div className="admin-edit-grid">
                <label className="admin-edit-label">
                  <span>Nombre</span>
                  <input
                    className="admin-edit-input"
                    value={editForm.name}
                    onChange={(event) =>
                      setEditForm((prevForm) => ({ ...prevForm, name: event.target.value }))
                    }
                  />
                </label>

                <label className="admin-edit-label">
                  <span>Precio</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="admin-edit-input"
                    value={editForm.price}
                    onChange={(event) =>
                      setEditForm((prevForm) => ({ ...prevForm, price: event.target.value }))
                    }
                  />
                </label>

                <label className="admin-edit-label">
                  <span>Stock</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="admin-edit-input"
                    value={editForm.stock}
                    onChange={(event) =>
                      setEditForm((prevForm) => ({ ...prevForm, stock: event.target.value }))
                    }
                  />
                </label>
              </div>

              <div className="admin-edit-checks">
                <label>
                  <input
                    type="checkbox"
                    checked={editForm.mayoreo}
                    onChange={(event) =>
                      setEditForm((prevForm) => ({ ...prevForm, mayoreo: event.target.checked }))
                    }
                  />
                  <span>Mayoreo</span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={editForm.menudeo}
                    onChange={(event) =>
                      setEditForm((prevForm) => ({ ...prevForm, menudeo: event.target.checked }))
                    }
                  />
                  <span>Menudeo</span>
                </label>
              </div>

              {editError && <p className="admin-auth-error">{editError}</p>}
              {editSuccess && <p className="admin-edit-success">{editSuccess}</p>}

              <div className="admin-edit-actions">
                <button
                  type="submit"
                  className="admin-row-action-button admin-row-action-button--save"
                  disabled={isSavingProduct}
                >
                  {isSavingProduct ? "Guardando..." : "Guardar cambios"}
                </button>
                <button
                  type="button"
                  className="admin-row-action-button admin-row-action-button--cancel"
                  onClick={cancelEditProduct}
                  disabled={isSavingProduct}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {!editingProductId && editSuccess && <p className="admin-edit-success">{editSuccess}</p>}
          {deleteError && <p className="admin-auth-error">{deleteError}</p>}
          {deleteSuccess && <p className="admin-edit-success">{deleteSuccess}</p>}
        </section>
      </main>
    </div>
  );
}

