/**
 * Dashboard principal del panel admin.
 *
 * Responsabilidades:
 * - Verificar sesión local y cargar productos desde API PHP.
 * - Mostrar estado de conexión backend (Hostinger/MySQL).
 * - Permitir edición rápida de producto (nombre, precio, stock, mayoreo/menudeo).
 * - Persistir cambios usando el endpoint admin de productos (`/admin/products/update.php`).
 */
import { ChangeEvent, FormEvent, Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  adminLogoutRequest,
  createAdminHomeSlide,
  createAdminProduct,
  deleteAdminHomeSlide,
  deleteAdminProduct,
  fetchAdminCategories,
  fetchAdminHomeSlides,
  fetchAdminOffers,
  fetchAdminProducts,
  fetchAdminSalesToday,
  removeAdminOffer,
  updateAdminProduct,
  uploadAdminProductImage,
  upsertAdminOffer,
} from "../services/adminApi";
import type {
  AdminCategory,
  AdminHomeSlide,
  AdminOffer,
  AdminProduct,
  AdminSalesProductRow,
  AdminSalesTodaySummary,
} from "../types/admin";
import { clearAdminSession, getAdminMode, getAdminToken } from "../utils/adminSession";
import { getImageValidationError } from "../utils/validation";

interface ProductEditFormState {
  name: string;
  price: string;
  stock: string;
  imageUrl: string;
  mayoreo: boolean;
  mayoreoPrice: string;
  mayoreoStock: string;
  homeCarouselSlot: HomeCarouselSlotFormValue;
}

interface ProductCreateFormState {
  name: string;
  categoryId: string;
  price: string;
  stock: string;
  imageUrl: string;
  mayoreo: boolean;
  mayoreoPrice: string;
  mayoreoStock: string;
  homeCarouselSlot: HomeCarouselSlotFormValue;
}

interface HomeSlideCreateFormState {
  imageUrl: string;
  displayOrder: string;
}

type HomeCarouselSlotFormValue = "0" | "1" | "2" | "3";
type HomeCarouselSlotValue = 0 | 1 | 2 | 3;
type AdminSectionView = "resumen" | "productos" | "inicio" | "ofertas" | "ingresos";
const MAX_PRODUCTS_PER_HOME_CAROUSEL = 6;
const PRODUCTS_PER_PAGE = 20;

export function AdminDashboard() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<AdminSectionView>("resumen");
  // Estado principal de datos del dashboard.
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [offers, setOffers] = useState<AdminOffer[]>([]);
  const [homeSlides, setHomeSlides] = useState<AdminHomeSlide[]>([]);
  const [salesSummary, setSalesSummary] = useState<AdminSalesTodaySummary>({
    totalRevenue: 0,
    totalUnits: 0,
    totalOrders: 0,
  });
  const [salesByProduct, setSalesByProduct] = useState<AdminSalesProductRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingOffers, setIsLoadingOffers] = useState(true);
  const [isLoadingHomeSlides, setIsLoadingHomeSlides] = useState(true);
  const [isLoadingSales, setIsLoadingSales] = useState(true);
  const [error, setError] = useState("");
  const [offerError, setOfferError] = useState("");
  const [offerSuccess, setOfferSuccess] = useState("");
  const [salesError, setSalesError] = useState("");
  const [salesMessage, setSalesMessage] = useState("");
  const [homeSlidesError, setHomeSlidesError] = useState("");
  const [homeSlidesSuccess, setHomeSlidesSuccess] = useState("");
  const [adminMode, setAdminMode] = useState<"api" | "unknown">("unknown");
  const [lastSyncAt, setLastSyncAt] = useState("");

  // Estado del formulario de edición de producto.
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const editFormRef = useRef<HTMLFormElement>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [editImageUploadError, setEditImageUploadError] = useState("");
  const [editImageUploadSuccess, setEditImageUploadSuccess] = useState("");
  const [isUploadingEditImage, setIsUploadingEditImage] = useState(false);
  const [editForm, setEditForm] = useState<ProductEditFormState>({
    name: "",
    price: "",
    stock: "",
    imageUrl: "",
    mayoreo: true,
    mayoreoPrice: "",
    mayoreoStock: "",
    homeCarouselSlot: "0",
  });
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [createImageUploadError, setCreateImageUploadError] = useState("");
  const [createImageUploadSuccess, setCreateImageUploadSuccess] = useState("");
  const [isUploadingCreateImage, setIsUploadingCreateImage] = useState(false);
  const [isDeletingProductId, setIsDeletingProductId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState("");
  const [isSavingOfferProductId, setIsSavingOfferProductId] = useState<number | null>(null);
  const [isSavingCarouselProductId, setIsSavingCarouselProductId] = useState<number | null>(null);
  const [carouselError, setCarouselError] = useState("");
  const [carouselSuccess, setCarouselSuccess] = useState("");
  const [isCreatingHomeSlide, setIsCreatingHomeSlide] = useState(false);
  const [isDeletingHomeSlideId, setIsDeletingHomeSlideId] = useState<number | null>(null);
  const [isUploadingSlideImage, setIsUploadingSlideImage] = useState(false);
  const [slideImageUploadError, setSlideImageUploadError] = useState("");
  const [slideImageUploadSuccess, setSlideImageUploadSuccess] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterProblems, setFilterProblems] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [stockAlertsExpanded, setStockAlertsExpanded] = useState(false);
  const [createForm, setCreateForm] = useState<ProductCreateFormState>({
    name: "",
    categoryId: "",
    price: "",
    stock: "",
    imageUrl: "",
    mayoreo: true,
    mayoreoPrice: "",
    mayoreoStock: "",
    homeCarouselSlot: "0",
  });
  const [homeSlideCreateForm, setHomeSlideCreateForm] = useState<HomeSlideCreateFormState>({
    imageUrl: "",
    displayOrder: "1",
  });

  const loadOffers = useCallback(async (token: string) => {
    setIsLoadingOffers(true);
    setOfferError("");
    setOfferSuccess("");

    try {
      const result = await fetchAdminOffers(token);
      if (!result.ok) {
        setOfferError(result.message ?? "No se pudieron cargar las ofertas.");
        setIsLoadingOffers(false);
        return;
      }

      setOffers(result.offers ?? []);
      setIsLoadingOffers(false);
    } catch (offersLoadError) {
      console.error(offersLoadError);
      setOfferError("No se pudo conectar con la API para cargar ofertas.");
      setIsLoadingOffers(false);
    }
  }, []);

  const loadHomeSlides = useCallback(async (token: string) => {
    setIsLoadingHomeSlides(true);
    setHomeSlidesError("");

    try {
      const result = await fetchAdminHomeSlides(token);
      if (!result.ok) {
        setHomeSlidesError(result.message ?? "No se pudieron cargar los slides del home.");
        setIsLoadingHomeSlides(false);
        return;
      }

      setHomeSlides(result.slides ?? []);
      setIsLoadingHomeSlides(false);
    } catch (homeSlidesLoadError) {
      console.error(homeSlidesLoadError);
      setHomeSlidesError("No se pudo conectar con la API para cargar slides.");
      setIsLoadingHomeSlides(false);
    }
  }, []);

  const loadSalesToday = useCallback(async (token: string) => {
    setIsLoadingSales(true);
    setSalesError("");
    setSalesMessage("");

    try {
      const result = await fetchAdminSalesToday(token);
      if (!result.ok) {
        setSalesError(result.message ?? "No se pudieron cargar los ingresos del día.");
        setIsLoadingSales(false);
        return;
      }

      setSalesSummary(
        result.summary ?? {
          totalRevenue: 0,
          totalUnits: 0,
          totalOrders: 0,
        }
      );
      setSalesByProduct(result.products ?? []);
      setSalesMessage(result.message ?? "");
      setIsLoadingSales(false);
    } catch (salesLoadError) {
      console.error(salesLoadError);
      setSalesError("No se pudo conectar con la API para cargar ingresos.");
      setIsLoadingSales(false);
    }
  }, []);

  function getOfferActionLabel(product: AdminProduct): string {
    if (isSavingOfferProductId === product.id) return "Guardando...";
    return product.isOffer === 1 ? "Quitar oferta" : "Poner oferta";
  }

  function getCarouselActionLabel(product: AdminProduct): string {
    if (isSavingCarouselProductId === product.id) return "Guardando...";
    if (product.homeCarouselSlot >= 1 && product.homeCarouselSlot <= 3) {
      return `Mover (C${product.homeCarouselSlot})`;
    }
    return "Asignar carrusel";
  }

  function getCarouselCapacityError(
    slot: HomeCarouselSlotValue,
    excludedProductId?: number
  ): string {
    if (slot === 0) return "";

    const assignedCount = products.filter((currentProduct) => {
      if (excludedProductId && currentProduct.id === excludedProductId) return false;
      return Number(currentProduct.homeCarouselSlot ?? 0) === slot;
    }).length;

    if (assignedCount < MAX_PRODUCTS_PER_HOME_CAROUSEL) return "";
    return `El Carrusel ${slot} ya tiene ${MAX_PRODUCTS_PER_HOME_CAROUSEL} productos. Quita o mueve uno antes de asignar.`;
  }

  function getCreateSubmitLabel(): string {
    if (isUploadingCreateImage) return "Subiendo imagen...";
    if (isCreatingProduct) return "Creando...";
    return "Crear producto";
  }

  function getEditSubmitLabel(): string {
    if (isUploadingEditImage) return "Subiendo imagen...";
    if (isSavingProduct) return "Guardando...";
    return "Guardar cambios";
  }

  function setImageUploadLoading(targetForm: "create" | "edit", isLoading: boolean) {
    if (targetForm === "create") {
      setIsUploadingCreateImage(isLoading);
      return;
    }

    setIsUploadingEditImage(isLoading);
  }

  function setImageUploadMessage(
    targetForm: "create" | "edit",
    message: string,
    messageType: "error" | "success"
  ) {
    if (targetForm === "create") {
      if (messageType === "error") {
        setCreateImageUploadError(message);
        setCreateImageUploadSuccess("");
      } else {
        setCreateImageUploadSuccess(message);
        setCreateImageUploadError("");
      }
      return;
    }

    if (messageType === "error") {
      setEditImageUploadError(message);
      setEditImageUploadSuccess("");
      return;
    }

    setEditImageUploadSuccess(message);
    setEditImageUploadError("");
  }

  function setImageUrlInForm(targetForm: "create" | "edit", imageUrl: string) {
    if (targetForm === "create") {
      setCreateForm((prevForm) => ({ ...prevForm, imageUrl }));
      return;
    }

    setEditForm((prevForm) => ({ ...prevForm, imageUrl }));
  }

  async function handleImageFileSelection(
    event: ChangeEvent<HTMLInputElement>,
    targetForm: "create" | "edit"
  ) {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const validationMessage = getImageValidationError(selectedFile);
    if (validationMessage) {
      setImageUploadMessage(targetForm, validationMessage, "error");
      event.target.value = "";
      return;
    }

    const token = getAdminToken();
    if (!token) {
      setImageUploadMessage(targetForm, "Sesión no válida. Vuelve a iniciar sesión.", "error");
      event.target.value = "";
      return;
    }

    setImageUploadLoading(targetForm, true);
    setImageUploadMessage(targetForm, "", "error");

    try {
      const uploadResult = await uploadAdminProductImage(selectedFile, token);
      if (!uploadResult.ok || !uploadResult.imageUrl) {
        setImageUploadMessage(
          targetForm,
          uploadResult.message ?? "No se pudo subir la imagen.",
          "error"
        );
        setImageUploadLoading(targetForm, false);
        event.target.value = "";
        return;
      }

      setImageUrlInForm(targetForm, uploadResult.imageUrl ?? "");
      setImageUploadMessage(targetForm, "Imagen subida correctamente.", "success");
      setImageUploadLoading(targetForm, false);
    } catch (uploadError) {
      console.error(uploadError);
      setImageUploadMessage(targetForm, "No se pudo conectar con la API para subir imagen.", "error");
      setImageUploadLoading(targetForm, false);
    } finally {
      event.target.value = "";
    }
  }

  useEffect(() => {
    // Si no hay token, bloquea acceso al dashboard.
    const token = getAdminToken();
    if (!token) {
      navigate("/admin/login", { replace: true });
      return;
    }
    const safeToken = token;

    async function loadProducts() {
      setIsLoading(true);
      setError("");

      // Modo guardado desde login (actualmente "api" cuando valida backend).
      const mode = getAdminMode();
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
    void loadOffers(safeToken);
    void loadHomeSlides(safeToken);
    void loadSalesToday(safeToken);
  }, [loadHomeSlides, loadOffers, loadSalesToday, navigate]);

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
    const token = getAdminToken();
    if (token) {
      try {
        await adminLogoutRequest(token);
      } catch (logoutError) {
        console.error(logoutError);
      }
    }

    clearAdminSession();
    navigate("/admin/login", { replace: true });
  }

  function startEditProduct(product: AdminProduct) {
    // Inicializa formulario con datos de la fila seleccionada.
    setEditingProductId(product.id);
    setEditError("");
    setEditSuccess("");
    setEditImageUploadError("");
    setEditImageUploadSuccess("");
    setEditForm({
      name: product.name,
      price: String(product.price),
      stock: String(product.stock),
      imageUrl: product.image ?? "",
      mayoreo: product.mayoreo === 1,
      mayoreoPrice: product.mayoreoPrice != null ? String(product.mayoreoPrice) : "",
      mayoreoStock: String(product.mayoreoStock ?? 0),
      homeCarouselSlot: String(product.homeCarouselSlot ?? 0) as HomeCarouselSlotFormValue,
    });
    // Auto-scroll al formulario de edición después de renderizar.
    requestAnimationFrame(() => {
      editFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function cancelEditProduct() {
    // Cierra formulario sin persistir cambios.
    setEditingProductId(null);
    setEditError("");
    setEditImageUploadError("");
    setEditImageUploadSuccess("");
  }

  async function handleDeleteProduct(product: AdminProduct) {
    const shouldDelete = globalThis.confirm(
      `¿Seguro que quieres eliminar "${product.name}"?\n\nSe eliminará de forma permanente.`
    );
    if (!shouldDelete) return;

    setDeleteError("");
    setDeleteSuccess("");
    setIsDeletingProductId(product.id);

    try {
      const token = getAdminToken();
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
      setOffers((prevOffers) =>
        prevOffers.filter((currentOffer) => currentOffer.productId !== result.deletedId)
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

  async function handleSetOffer(product: AdminProduct) {
    const defaultPrice = product.offerPrice ?? product.price;
    const promptValue = globalThis.prompt(
      `Precio de oferta para "${product.name}"`,
      String(defaultPrice)
    );
    if (promptValue === null) return;

    const parsedOfferPrice = Number(promptValue);
    if (Number.isNaN(parsedOfferPrice) || parsedOfferPrice < 0) {
      setOfferError("El precio de oferta debe ser un número válido mayor o igual a 0.");
      setOfferSuccess("");
      return;
    }
    if (parsedOfferPrice >= product.price) {
      setOfferError("La oferta debe ser menor al precio actual del producto.");
      setOfferSuccess("");
      return;
    }

    const token = getAdminToken();
    if (!token) {
      setOfferError("Sesión no válida. Vuelve a iniciar sesión.");
      setOfferSuccess("");
      return;
    }

    setOfferError("");
    setOfferSuccess("");
    setIsSavingOfferProductId(product.id);

    try {
      const result = await upsertAdminOffer(
        {
          productId: product.id,
          offerPrice: parsedOfferPrice,
        },
        token
      );

      if (!result.ok || !result.offer) {
        setOfferError(result.message ?? "No se pudo guardar la oferta.");
        setIsSavingOfferProductId(null);
        return;
      }

      const updatedOffer = result.offer;
      setOffers((prevOffers) => {
        const existingIndex = prevOffers.findIndex(
          (existingOffer) => existingOffer.productId === updatedOffer.productId
        );
        if (existingIndex === -1) return [updatedOffer, ...prevOffers];

        const nextOffers = [...prevOffers];
        nextOffers[existingIndex] = updatedOffer;
        return nextOffers;
      });

      setProducts((prevProducts) =>
        prevProducts.map((currentProduct) =>
          currentProduct.id === product.id
            ? {
                ...currentProduct,
                isOffer: 1,
                offerPrice: updatedOffer.offerPrice,
              }
            : currentProduct
        )
      );

      setOfferSuccess("Oferta guardada correctamente.");
      setIsSavingOfferProductId(null);
    } catch (offerSaveError) {
      console.error(offerSaveError);
      setOfferError("No se pudo conectar con la API para guardar la oferta.");
      setIsSavingOfferProductId(null);
    }
  }

  async function handleRemoveOffer(productId: number) {
    const token = getAdminToken();
    if (!token) {
      setOfferError("Sesión no válida. Vuelve a iniciar sesión.");
      setOfferSuccess("");
      return;
    }

    setOfferError("");
    setOfferSuccess("");
    setIsSavingOfferProductId(productId);

    try {
      const result = await removeAdminOffer({ productId }, token);
      if (!result.ok) {
        setOfferError(result.message ?? "No se pudo eliminar la oferta.");
        setIsSavingOfferProductId(null);
        return;
      }

      setOffers((prevOffers) =>
        prevOffers.filter((currentOffer) => currentOffer.productId !== productId)
      );
      setProducts((prevProducts) =>
        prevProducts.map((currentProduct) =>
          currentProduct.id === productId
            ? {
                ...currentProduct,
                isOffer: 0,
                offerPrice: null,
              }
            : currentProduct
        )
      );

      setOfferSuccess("Oferta eliminada correctamente.");
      setIsSavingOfferProductId(null);
    } catch (offerRemoveError) {
      console.error(offerRemoveError);
      setOfferError("No se pudo conectar con la API para eliminar la oferta.");
      setIsSavingOfferProductId(null);
    }
  }

  async function handleAssignCarousel(product: AdminProduct) {
    const promptValue = globalThis.prompt(
      `Carrusel para "${product.name}"\n\n0 = Sin carrusel\n1 = Carrusel 1 (Destacados)\n2 = Carrusel 2 (Arte y Manualidades)\n3 = Carrusel 3 (Oficina y Escolares)`,
      String(product.homeCarouselSlot ?? 0)
    );
    if (promptValue === null) return;

    const parsedSlot = Number(promptValue);
    if (!Number.isInteger(parsedSlot) || parsedSlot < 0 || parsedSlot > 3) {
      setCarouselError("Debes ingresar 0, 1, 2 o 3.");
      setCarouselSuccess("");
      return;
    }

    const capacityError = getCarouselCapacityError(
      parsedSlot as HomeCarouselSlotValue,
      product.id
    );
    if (capacityError) {
      setCarouselError(capacityError);
      setCarouselSuccess("");
      return;
    }

    const token = getAdminToken();
    if (!token) {
      setCarouselError("Sesión no válida. Vuelve a iniciar sesión.");
      setCarouselSuccess("");
      return;
    }

    setCarouselError("");
    setCarouselSuccess("");
    setIsSavingCarouselProductId(product.id);

    try {
      const result = await updateAdminProduct(
        {
          id: product.id,
          name: product.name,
          price: product.price,
          stock: product.stock,
          imageUrl: "",
          mayoreo: product.mayoreo ? 1 : 0,
          menudeo: 1,
          mayoreoPrice: product.mayoreoPrice ?? null,
          mayoreoStock: product.mayoreoStock ?? 0,
          menudeoPrice: null,
          menudeoStock: 0,
          homeCarouselSlot: parsedSlot as HomeCarouselSlotValue,
        },
        token
      );

      if (!result.ok || !result.product) {
        setCarouselError(result.message ?? "No se pudo actualizar el carrusel del producto.");
        setIsSavingCarouselProductId(null);
        return;
      }

      const updatedProduct = result.product;
      setProducts((prevProducts) =>
        prevProducts.map((currentProduct) =>
          currentProduct.id === updatedProduct.id ? updatedProduct : currentProduct
        )
      );

      const slotLabel = updatedProduct.homeCarouselSlot === 0
        ? "sin carrusel"
        : `Carrusel ${updatedProduct.homeCarouselSlot}`;
      setCarouselSuccess(`Producto actualizado: ${slotLabel}.`);
      setIsSavingCarouselProductId(null);
    } catch (carouselUpdateError) {
      console.error(carouselUpdateError);
      setCarouselError("No se pudo conectar con la API para asignar carrusel.");
      setIsSavingCarouselProductId(null);
    }
  }

  async function handleCreateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedCategoryId = Number(createForm.categoryId);
    const parsedPrice = Number(createForm.price);
    const parsedStock = Number(createForm.stock);
    const parsedHomeCarouselSlot = Number(createForm.homeCarouselSlot);
    const homeCarouselSlot = (
      parsedHomeCarouselSlot >= 1 && parsedHomeCarouselSlot <= 3 ? parsedHomeCarouselSlot : 0
    ) as HomeCarouselSlotValue;

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

    const capacityError = getCarouselCapacityError(homeCarouselSlot);
    if (capacityError) {
      setCreateError(capacityError);
      return;
    }

    setIsCreatingProduct(true);
    setCreateError("");
    setCreateSuccess("");

    try {
      const token = getAdminToken();
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
        imageUrl: createForm.imageUrl.trim(),
        mayoreo: createForm.mayoreo ? 1 : 0,
        menudeo: 1,
        mayoreoPrice: createForm.mayoreo && createForm.mayoreoPrice ? Number(createForm.mayoreoPrice) : null,
        mayoreoStock: createForm.mayoreo ? Number(createForm.mayoreoStock) || 0 : 0,
        menudeoPrice: null,
        menudeoStock: 0,
        homeCarouselSlot,
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
        imageUrl: "",
        mayoreo: true,
        mayoreoPrice: "",
        mayoreoStock: "",
        homeCarouselSlot: "0",
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
    const parsedHomeCarouselSlot = Number(editForm.homeCarouselSlot);
    const homeCarouselSlot = (
      parsedHomeCarouselSlot >= 1 && parsedHomeCarouselSlot <= 3 ? parsedHomeCarouselSlot : 0
    ) as HomeCarouselSlotValue;

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

    const capacityError = getCarouselCapacityError(homeCarouselSlot, editingProductId);
    if (capacityError) {
      setEditError(capacityError);
      return;
    }

    setIsSavingProduct(true);
    setEditError("");
    setEditSuccess("");

    try {
      const token = getAdminToken();
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
        imageUrl: editForm.imageUrl.trim(),
        mayoreo: editForm.mayoreo ? 1 : 0,
        menudeo: 1,
        mayoreoPrice: editForm.mayoreo && editForm.mayoreoPrice ? Number(editForm.mayoreoPrice) : null,
        mayoreoStock: editForm.mayoreo ? Number(editForm.mayoreoStock) || 0 : 0,
        menudeoPrice: null,
        menudeoStock: 0,
        homeCarouselSlot,
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

  async function handleSlideImageFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const validationMessage = getImageValidationError(selectedFile);
    if (validationMessage) {
      setSlideImageUploadError(validationMessage);
      setSlideImageUploadSuccess("");
      event.target.value = "";
      return;
    }

    const token = getAdminToken();
    if (!token) {
      setSlideImageUploadError("Sesión no válida. Vuelve a iniciar sesión.");
      setSlideImageUploadSuccess("");
      event.target.value = "";
      return;
    }

    setIsUploadingSlideImage(true);
    setSlideImageUploadError("");
    setSlideImageUploadSuccess("");

    try {
      const uploadResult = await uploadAdminProductImage(selectedFile, token);
      if (!uploadResult.ok || !uploadResult.imageUrl) {
        setSlideImageUploadError(uploadResult.message ?? "No se pudo subir la imagen del slide.");
        setIsUploadingSlideImage(false);
        event.target.value = "";
        return;
      }

      setHomeSlideCreateForm((prevForm) => ({ ...prevForm, imageUrl: uploadResult.imageUrl ?? "" }));
      setSlideImageUploadSuccess("Imagen del slide subida correctamente.");
      setIsUploadingSlideImage(false);
      event.target.value = "";
    } catch (slideUploadError) {
      console.error(slideUploadError);
      setSlideImageUploadError("No se pudo conectar con la API para subir la imagen.");
      setIsUploadingSlideImage(false);
      event.target.value = "";
    }
  }

  async function handleCreateHomeSlide(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const imageUrl = homeSlideCreateForm.imageUrl.trim();
    const parsedDisplayOrder = Number(homeSlideCreateForm.displayOrder);
    const displayOrder = Number.isInteger(parsedDisplayOrder) && parsedDisplayOrder > 0
      ? parsedDisplayOrder
      : 1;

    if (!imageUrl) {
      setHomeSlidesError("La imagen del slide es obligatoria.");
      setHomeSlidesSuccess("");
      return;
    }

    const token = getAdminToken();
    if (!token) {
      setHomeSlidesError("Sesión no válida. Vuelve a iniciar sesión.");
      setHomeSlidesSuccess("");
      return;
    }

    setIsCreatingHomeSlide(true);
    setHomeSlidesError("");
    setHomeSlidesSuccess("");

    try {
      const result = await createAdminHomeSlide(
        {
          imageUrl,
          displayOrder,
          isActive: 1,
        },
        token
      );

      if (!result.ok || !result.slide) {
        setHomeSlidesError(result.message ?? "No se pudo crear el slide.");
        setIsCreatingHomeSlide(false);
        return;
      }

      const createdSlide = result.slide;

      setHomeSlides((prevSlides) =>
        [...prevSlides, createdSlide].sort(
          (leftSlide, rightSlide) => leftSlide.displayOrder - rightSlide.displayOrder
        )
      );
      setHomeSlideCreateForm({ imageUrl: "", displayOrder: "1" });
      setSlideImageUploadError("");
      setSlideImageUploadSuccess("");
      setHomeSlidesSuccess("Slide creado correctamente.");
      setIsCreatingHomeSlide(false);
    } catch (slideCreateError) {
      console.error(slideCreateError);
      setHomeSlidesError("No se pudo conectar con la API para crear el slide.");
      setIsCreatingHomeSlide(false);
    }
  }

  async function handleDeleteHomeSlide(slideId: number) {
    const token = getAdminToken();
    if (!token) {
      setHomeSlidesError("Sesión no válida. Vuelve a iniciar sesión.");
      setHomeSlidesSuccess("");
      return;
    }

    const shouldDelete = globalThis.confirm(
      "¿Seguro que quieres eliminar este slide del banner principal?"
    );
    if (!shouldDelete) return;

    setIsDeletingHomeSlideId(slideId);
    setHomeSlidesError("");
    setHomeSlidesSuccess("");

    try {
      const result = await deleteAdminHomeSlide({ id: slideId }, token);
      if (!result.ok) {
        setHomeSlidesError(result.message ?? "No se pudo eliminar el slide.");
        setIsDeletingHomeSlideId(null);
        return;
      }

      setHomeSlides((prevSlides) => prevSlides.filter((slide) => slide.id !== slideId));
      setHomeSlidesSuccess("Slide eliminado correctamente.");
      setIsDeletingHomeSlideId(null);
    } catch (slideDeleteError) {
      console.error(slideDeleteError);
      setHomeSlidesError("No se pudo conectar con la API para eliminar el slide.");
      setIsDeletingHomeSlideId(null);
    }
  }

  // Mensaje contextual en sidebar para saber si hay conexión real con backend.
  function getSidebarStatusMessage() {
    if (adminMode === "api" && !error)
      return "Conectado a Hostinger: API PHP y servidor activos.";

    if (error)
      return "No hay conexión con la API en este momento. Revisa Hostinger, dominio y CORS.";

    return "Estado de conexión en verificación...";
  }

  const totalCategories = new Set(products.map((product) => product.category)).size;
  const lowStockProducts = products.filter((product) => product.stock <= lowStockThreshold);
  const lowStockCount = lowStockProducts.length;
  const mayoreoEnabledCount = products.filter((product) => product.mayoreo === 1).length;

  // ── Filtrado y paginación de productos ──
  const uniqueCategories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category).filter(Boolean));
    return Array.from(cats).sort((a, b) => a.localeCompare(b, "es"));
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          String(p.id).includes(q)
      );
    }
    if (filterCategory) {
      result = result.filter((p) => p.category === filterCategory);
    }
    if (filterProblems === "sin-precio") {
      result = result.filter((p) => Number(p.price) === 0);
    } else if (filterProblems === "sin-stock") {
      result = result.filter((p) => Number(p.stock) === 0);
    } else if (filterProblems === "sin-categoria") {
      result = result.filter((p) => !p.category || p.category === "Sin categor\u00eda");
    }
    if (sortOrder === "price-asc") {
      result = [...result].sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortOrder === "price-desc") {
      result = [...result].sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortOrder === "stock-asc") {
      result = [...result].sort((a, b) => Number(a.stock) - Number(b.stock));
    } else if (sortOrder === "name-asc") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name, "es"));
    }
    return result;
  }, [products, searchQuery, filterCategory, filterProblems, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProducts = useMemo(() => {
    const start = (safePage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredProducts, safePage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory, filterProblems, sortOrder]);
  const offersCount = products.filter((product) => product.isOffer === 1).length;

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleMobileSectionChange(section: AdminSectionView) {
    setActiveSection(section);
    setIsMobileMenuOpen(false);
    scrollToTop();
  }

  return (
    <div className="admin-layout">
      {/* ── Navbar mobile sticky ── */}
      <header className="admin-mobile-navbar">
        <button
          type="button"
          className="admin-mobile-logo"
          onClick={scrollToTop}
          aria-label="Volver arriba"
        >
          <span className="admin-mobile-logo-icon">✦</span>
          <span className="admin-mobile-logo-text">God Art</span>
        </button>
        <button
          type="button"
          className={`admin-mobile-hamburger ${isMobileMenuOpen ? "admin-mobile-hamburger--open" : ""}`}
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
        >
          <span className="admin-hamburger-line" />
          <span className="admin-hamburger-line" />
          <span className="admin-hamburger-line" />
        </button>
      </header>

      {/* ── Menú lateral mobile ── */}
      {isMobileMenuOpen && (
        <button
          type="button"
          className="admin-mobile-backdrop"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="Cerrar menú"
        />
      )}
      <nav className={`admin-mobile-menu ${isMobileMenuOpen ? "admin-mobile-menu--open" : ""}`}>
        <div className="admin-mobile-menu-header">
          <span className="admin-mobile-menu-brand">Panel Admin</span>
          <button
            type="button"
            className="admin-mobile-menu-close"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Cerrar menú"
          >
            ✕
          </button>
        </div>
        <div className="admin-mobile-menu-items">
          {([
            { key: "resumen" as const, label: "📊 Resumen" },
            { key: "productos" as const, label: "📦 Productos" },
            { key: "inicio" as const, label: "🖼️ Inicio (Slides)" },
            { key: "ofertas" as const, label: "🏷️ Ofertas" },
            { key: "ingresos" as const, label: "💰 Ingresos" },
          ]).map((item) => (
            <button
              key={item.key}
              type="button"
              className={`admin-mobile-menu-item ${activeSection === item.key ? "admin-mobile-menu-item--active" : ""}`}
              onClick={() => handleMobileSectionChange(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="admin-mobile-menu-footer">
          <button
            type="button"
            className="admin-mobile-menu-item"
            onClick={() => { setIsMobileMenuOpen(false); navigate("/"); }}
          >
            🏪 Ver tienda
          </button>
          <button
            type="button"
            className="admin-mobile-menu-item admin-mobile-menu-item--logout"
            onClick={() => { setIsMobileMenuOpen(false); void handleLogout(); }}
          >
            🚪 Cerrar sesión
          </button>
        </div>
      </nav>
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <span className="admin-badge">God Art</span>
          <h2>Panel admin</h2>
          <p>Gestión interna de la papelería.</p>
        </div>

        <nav className="admin-sidebar-nav">
          <button
            type="button"
            className={`admin-nav-item ${activeSection === "resumen" ? "admin-nav-item--active" : ""}`}
            onClick={() => setActiveSection("resumen")}
          >
            Resumen
          </button>
          <button
            type="button"
            className={`admin-nav-item ${activeSection === "productos" ? "admin-nav-item--active" : ""}`}
            onClick={() => setActiveSection("productos")}
          >
            Productos
          </button>
          <button
            type="button"
            className={`admin-nav-item ${activeSection === "inicio" ? "admin-nav-item--active" : ""}`}
            onClick={() => setActiveSection("inicio")}
          >
            Inicio (Slides)
          </button>
          <button
            type="button"
            className={`admin-nav-item ${activeSection === "ofertas" ? "admin-nav-item--active" : ""}`}
            onClick={() => setActiveSection("ofertas")}
          >
            Ofertas
          </button>
          <button
            type="button"
            className={`admin-nav-item ${activeSection === "ingresos" ? "admin-nav-item--active" : ""}`}
            onClick={() => setActiveSection("ingresos")}
          >
            Ingresos
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
        {activeSection === "resumen" && (
          <>
            <header className="admin-main-header admin-main-header--hero">
          <div className="admin-header-topline">
            <div>
              <span className="admin-header-eyebrow">Panel privado</span>
              <h1>Control de catálogo</h1>
              <p>
                Panel actualizado con módulos de productos, ofertas e ingresos.
                Ahora puedes activar ofertas por producto y revisar alertas de surtido
                antes de que se agote inventario.
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
            <span className="admin-status-chip">Productos con oferta: {offersCount}</span>
            <span className="admin-status-chip">Alertas de inventario: {lowStockCount}</span>
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
            <h2>Ofertas activas</h2>
            <p className="admin-card-number">{offersCount}</p>
            <p className="admin-card-description">
              Productos con precio promocional activo.
            </p>
            <p className="admin-card-note">Puedes quitarlas sin borrar el producto.</p>
          </article>

          <article className="admin-card">
            <h2>Stock bajo</h2>
            <p className="admin-card-number">{lowStockCount}</p>
            <p className="admin-card-description">
              Productos con stock menor o igual a {lowStockThreshold} unidades.
            </p>
            <p className="admin-card-note">Métrica visual para decisiones rápidas de inventario.</p>
          </article>

          <article className="admin-card">
            <h2>Mayoreo habilitado</h2>
            <p className="admin-card-number">{mayoreoEnabledCount}</p>
            <p className="admin-card-description">
              Productos que actualmente permiten compra por mayoreo.
            </p>
            <p className="admin-card-note">Categorías detectadas en catálogo: {totalCategories}.</p>
          </article>
            </section>
          </>
        )}

        {activeSection === "productos" && (
          <section className="admin-info-panel">
          <div className="admin-panel-header">
            <h2>Gestión de productos</h2>
            <p>
              Módulo principal para agregar, editar, eliminar y activar ofertas.
              También incluye alertas de inventario para surtir antes de que se agoten productos.
            </p>
          </div>
          <div className="admin-surface-card admin-stock-alerts-panel">
            <div className="admin-stock-alerts-header">
              <h3>Aviso de inventario</h3>
              <label className="admin-threshold-label">
                <span>Stock mínimo</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="admin-edit-input"
                  value={lowStockThreshold}
                  onChange={(event) => setLowStockThreshold(Math.max(1, Number(event.target.value) || 1))}
                />
              </label>
            </div>
            {lowStockProducts.length === 0 && (
              <p className="admin-stock-alerts-empty">
                No hay productos en nivel crítico con el umbral actual.
              </p>
            )}
            {lowStockProducts.length > 0 && (
              <>
                <p className="admin-stock-alerts-summary">
                  <span className="admin-stock-badge admin-stock-badge--warn">{lowStockProducts.length}</span>
                  {lowStockProducts.length === 1 ? "producto con stock bajo" : "productos con stock bajo"}
                </p>
                <ul className="admin-stock-alerts-list">
                  {(stockAlertsExpanded ? lowStockProducts : lowStockProducts.slice(0, 6)).map((product) => (
                    <li key={product.id} className="admin-stock-alert-item">
                      <button
                        type="button"
                        className="admin-stock-alert-btn"
                        onClick={() => startEditProduct(product)}
                        title="Click para editar este producto"
                      >
                        <span className="admin-stock-alert-name">{product.name}</span>
                        <span className={`admin-stock-pill ${product.stock === 0 ? "admin-stock-pill--critical" : "admin-stock-pill--low"}`}>
                          {product.stock}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                {lowStockProducts.length > 6 && (
                  <button
                    type="button"
                    className="admin-stock-alerts-toggle"
                    onClick={() => setStockAlertsExpanded((prev) => !prev)}
                  >
                    {stockAlertsExpanded
                      ? "Mostrar menos \u25B2"
                      : `Ver todos (${lowStockProducts.length}) \u25BC`}
                  </button>
                )}
              </>
            )}
          </div>
          {offerError && <p className="admin-auth-error">{offerError}</p>}
          {offerSuccess && <p className="admin-edit-success">{offerSuccess}</p>}
          {carouselError && <p className="admin-auth-error">{carouselError}</p>}
          {carouselSuccess && <p className="admin-edit-success">{carouselSuccess}</p>}
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

              <label className="admin-edit-label">
                <span>Carrusel Home</span>
                <select
                  className="admin-edit-input"
                  value={createForm.homeCarouselSlot}
                  onChange={(event) =>
                    setCreateForm((prevForm) => ({
                      ...prevForm,
                      homeCarouselSlot: event.target.value as HomeCarouselSlotFormValue,
                    }))
                  }
                >
                  <option value="0">Sin carrusel</option>
                  <option value="1">Carrusel 1 (Destacados)</option>
                  <option value="2">Carrusel 2 (Arte y Manualidades)</option>
                  <option value="3">Carrusel 3 (Oficina y Escolares)</option>
                </select>
              </label>

              <label className="admin-edit-label">
                <span>Imagen (URL)</span>
                <input
                  type="url"
                  className="admin-edit-input"
                  value={createForm.imageUrl}
                  onChange={(event) =>
                    setCreateForm((prevForm) => ({ ...prevForm, imageUrl: event.target.value }))
                  }
                  placeholder="https://..."
                />
              </label>

              <label className="admin-edit-label">
                <span>Imagen (archivo)</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="admin-edit-input admin-edit-input--file"
                  onChange={(event) => void handleImageFileSelection(event, "create")}
                  disabled={isUploadingCreateImage}
                />
              </label>
            </div>

            {createForm.imageUrl && (
              <div className="admin-image-preview-wrap">
                <img src={createForm.imageUrl} alt="Vista previa de producto" className="admin-image-preview" />
              </div>
            )}
            {createImageUploadError && <p className="admin-auth-error">{createImageUploadError}</p>}
            {createImageUploadSuccess && <p className="admin-edit-success">{createImageUploadSuccess}</p>}

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
              {createForm.mayoreo && (
                <div className="admin-edit-grid" style={{ marginTop: 8 }}>
                  <label className="admin-edit-label">
                    <span>Precio mayoreo</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="admin-edit-input"
                      value={createForm.mayoreoPrice}
                      onChange={(event) =>
                        setCreateForm((prevForm) => ({ ...prevForm, mayoreoPrice: event.target.value }))
                      }
                      placeholder="Precio de mayoreo"
                    />
                  </label>
                  <label className="admin-edit-label">
                    <span>Stock mayoreo</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="admin-edit-input"
                      value={createForm.mayoreoStock}
                      onChange={(event) =>
                        setCreateForm((prevForm) => ({ ...prevForm, mayoreoStock: event.target.value }))
                      }
                      placeholder="Stock de mayoreo"
                    />
                  </label>
                </div>
              )}
            </div>

            {createError && <p className="admin-auth-error">{createError}</p>}
            {createSuccess && <p className="admin-edit-success">{createSuccess}</p>}

            <div className="admin-edit-actions">
              <button
                type="submit"
                className="admin-row-action-button admin-row-action-button--save"
                disabled={isCreatingProduct || isUploadingCreateImage || categories.length === 0}
              >
                {getCreateSubmitLabel()}
              </button>
            </div>
          </form>

          {isLoading && <p>Cargando productos...</p>}
          {!isLoading && error && <p className="admin-auth-error">{error}</p>}
          {!isLoading && !error && products.length === 0 && (
            <p>No hay productos registrados.</p>
          )}
          {!isLoading && !error && products.length > 0 && (
            <div className="admin-table-wrapper admin-surface-card">
              <div className="admin-table-toolbar">
                <input
                  type="text"
                  className="admin-search-input"
                  placeholder="🔍 Buscar por nombre, categoría o ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="admin-toolbar-filters">
                  <select
                    className="admin-filter-select"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <option value="">📂 Categoría</option>
                    {uniqueCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <select
                    className="admin-filter-select"
                    value={filterProblems}
                    onChange={(e) => setFilterProblems(e.target.value)}
                  >
                    <option value="">⚠️ Problemas</option>
                    <option value="sin-precio">Sin precio ($0)</option>
                    <option value="sin-stock">Sin stock (0)</option>
                    <option value="sin-categoria">Sin categoría</option>
                  </select>
                  <select
                    className="admin-filter-select"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  >
                    <option value="">↕️ Ordenar</option>
                    <option value="price-asc">Precio: menor a mayor</option>
                    <option value="price-desc">Precio: mayor a menor</option>
                    <option value="stock-asc">Stock: menor a mayor</option>
                    <option value="name-asc">Nombre: A-Z</option>
                  </select>
                </div>
                <p className="admin-toolbar-count">
                  Mostrando {paginatedProducts.length} de {filteredProducts.length} productos
                  {filteredProducts.length < products.length && ` (${products.length} total)`}
                </p>
              </div>
              <div className="admin-table-scroll">
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
                    <th>Carrusel</th>
                    <th>Oferta</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((product) => (
                    <tr key={product.id}>
                      <td>{product.id}</td>
                      <td>{product.name}</td>
                      <td>{product.category}</td>
                      <td>${Number(product.price).toFixed(2)}</td>
                      <td>
                        <span
                          className={`admin-stock-pill ${
                            product.stock <= lowStockThreshold
                              ? "admin-stock-pill--low"
                              : "admin-stock-pill--ok"
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
                        {product.homeCarouselSlot >= 1 && product.homeCarouselSlot <= 3 ? (
                          <span className="admin-flag admin-flag--on">Carrusel {product.homeCarouselSlot}</span>
                        ) : (
                          <span className="admin-flag admin-flag--off">Sin carrusel</span>
                        )}
                      </td>
                      <td>
                        {product.isOffer === 1 && product.offerPrice !== null ? (
                          <span className="admin-offer-price">${Number(product.offerPrice).toFixed(2)}</span>
                        ) : (
                          <span className="admin-flag admin-flag--off">Sin oferta</span>
                        )}
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
                          <button
                            type="button"
                            className="admin-row-action-button admin-row-action-button--ghost"
                            onClick={() => void handleAssignCarousel(product)}
                            disabled={isSavingCarouselProductId === product.id}
                          >
                            {getCarouselActionLabel(product)}
                          </button>
                          <button
                            type="button"
                            className="admin-row-action-button admin-row-action-button--save"
                            onClick={() =>
                              product.isOffer === 1
                                ? void handleRemoveOffer(product.id)
                                : void handleSetOffer(product)
                            }
                            disabled={isSavingOfferProductId === product.id}
                          >
                            {getOfferActionLabel(product)}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              {totalPages > 1 && (
                <div className="admin-pagination">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    ← Anterior
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      if (totalPages <= 7) return true;
                      if (page === 1 || page === totalPages) return true;
                      if (Math.abs(page - safePage) <= 1) return true;
                      return false;
                    })
                    .map((page, idx, arr) => {
                      const showEllipsis = idx > 0 && page - arr[idx - 1] > 1;
                      return (
                        <Fragment key={page}>
                          {showEllipsis && <span className="admin-pagination-ellipsis">…</span>}
                          <button
                            type="button"
                            className={safePage === page ? "active" : ""}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </button>
                        </Fragment>
                      );
                    })}
                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </div>
          )}

          {editingProductId && (
            <form ref={editFormRef} className="admin-edit-form admin-surface-card" onSubmit={handleSaveProduct}>
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

                <label className="admin-edit-label">
                  <span>Carrusel Home</span>
                  <select
                    className="admin-edit-input"
                    value={editForm.homeCarouselSlot}
                    onChange={(event) =>
                      setEditForm((prevForm) => ({
                        ...prevForm,
                        homeCarouselSlot: event.target.value as HomeCarouselSlotFormValue,
                      }))
                    }
                  >
                    <option value="0">Sin carrusel</option>
                    <option value="1">Carrusel 1 (Destacados)</option>
                    <option value="2">Carrusel 2 (Arte y Manualidades)</option>
                    <option value="3">Carrusel 3 (Oficina y Escolares)</option>
                  </select>
                </label>

                <label className="admin-edit-label">
                  <span>Imagen (URL)</span>
                  <input
                    type="url"
                    className="admin-edit-input"
                    value={editForm.imageUrl}
                    onChange={(event) =>
                      setEditForm((prevForm) => ({ ...prevForm, imageUrl: event.target.value }))
                    }
                    placeholder="https://..."
                  />
                </label>

                <label className="admin-edit-label">
                  <span>Imagen (archivo)</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="admin-edit-input admin-edit-input--file"
                    onChange={(event) => void handleImageFileSelection(event, "edit")}
                    disabled={isUploadingEditImage}
                  />
                </label>
              </div>

              {editForm.imageUrl && (
                <div className="admin-image-preview-wrap">
                  <img src={editForm.imageUrl} alt="Vista previa de producto" className="admin-image-preview" />
                </div>
              )}
              {editImageUploadError && <p className="admin-auth-error">{editImageUploadError}</p>}
              {editImageUploadSuccess && <p className="admin-edit-success">{editImageUploadSuccess}</p>}

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
                {editForm.mayoreo && (
                  <div className="admin-edit-grid" style={{ marginTop: 8 }}>
                    <label className="admin-edit-label">
                      <span>Precio mayoreo</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="admin-edit-input"
                        value={editForm.mayoreoPrice}
                        onChange={(event) =>
                          setEditForm((prevForm) => ({ ...prevForm, mayoreoPrice: event.target.value }))
                        }
                        placeholder="Precio de mayoreo"
                      />
                    </label>
                    <label className="admin-edit-label">
                      <span>Stock mayoreo</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="admin-edit-input"
                        value={editForm.mayoreoStock}
                        onChange={(event) =>
                          setEditForm((prevForm) => ({ ...prevForm, mayoreoStock: event.target.value }))
                        }
                        placeholder="Stock de mayoreo"
                      />
                    </label>
                  </div>
                )}
              </div>

              {editError && <p className="admin-auth-error">{editError}</p>}
              {editSuccess && <p className="admin-edit-success">{editSuccess}</p>}

              <div className="admin-edit-actions">
                <button
                  type="submit"
                  className="admin-row-action-button admin-row-action-button--save"
                  disabled={isSavingProduct || isUploadingEditImage}
                >
                  {getEditSubmitLabel()}
                </button>
                <button
                  type="button"
                  className="admin-row-action-button admin-row-action-button--cancel"
                  onClick={cancelEditProduct}
                  disabled={isSavingProduct || isUploadingEditImage}
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
        )}

        {activeSection === "inicio" && (
          <section className="admin-info-panel admin-module-section">
            <div className="admin-panel-header">
              <h2>Inicio: Carruseles y Slide principal</h2>
              <p>
                Configura qué productos van al carrusel 1, 2 o 3 desde la sección de productos.
                Aquí se administra el slide principal con imagen completa de todo el banner.
              </p>
            </div>

            <form className="admin-create-form admin-surface-card" onSubmit={handleCreateHomeSlide}>
              <h3>Agregar imagen al slide principal</h3>
              <div className="admin-edit-grid">
                <label className="admin-edit-label">
                  <span>Imagen (URL)</span>
                  <input
                    type="url"
                    className="admin-edit-input"
                    value={homeSlideCreateForm.imageUrl}
                    onChange={(event) =>
                      setHomeSlideCreateForm((prevForm) => ({ ...prevForm, imageUrl: event.target.value }))
                    }
                    placeholder="https://..."
                  />
                </label>

                <label className="admin-edit-label">
                  <span>Imagen (archivo)</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="admin-edit-input admin-edit-input--file"
                    onChange={(event) => void handleSlideImageFileSelection(event)}
                    disabled={isUploadingSlideImage}
                  />
                </label>

                <label className="admin-edit-label">
                  <span>Orden de slide</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    className="admin-edit-input"
                    value={homeSlideCreateForm.displayOrder}
                    onChange={(event) =>
                      setHomeSlideCreateForm((prevForm) => ({
                        ...prevForm,
                        displayOrder: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              {homeSlideCreateForm.imageUrl && (
                <div className="admin-slide-preview-wrap">
                  <img
                    src={homeSlideCreateForm.imageUrl}
                    alt="Vista previa de slide principal"
                    className="admin-slide-preview"
                  />
                </div>
              )}

              {slideImageUploadError && <p className="admin-auth-error">{slideImageUploadError}</p>}
              {slideImageUploadSuccess && <p className="admin-edit-success">{slideImageUploadSuccess}</p>}
              {homeSlidesError && <p className="admin-auth-error">{homeSlidesError}</p>}
              {homeSlidesSuccess && <p className="admin-edit-success">{homeSlidesSuccess}</p>}

              <div className="admin-edit-actions">
                <button
                  type="submit"
                  className="admin-row-action-button admin-row-action-button--save"
                  disabled={isCreatingHomeSlide || isUploadingSlideImage}
                >
                  {isCreatingHomeSlide ? "Guardando..." : "Guardar slide"}
                </button>
              </div>
            </form>

            {isLoadingHomeSlides && <p>Cargando slides del home...</p>}
            {!isLoadingHomeSlides && homeSlides.length === 0 && !homeSlidesError && (
              <p>No hay slides configurados todavía.</p>
            )}
            {!isLoadingHomeSlides && homeSlides.length > 0 && (
              <div className="admin-home-slides-grid">
                {homeSlides.map((slide) => (
                  <article key={slide.id} className="admin-home-slide-card admin-surface-card">
                    <img src={slide.imageUrl} alt={`Slide ${slide.id}`} className="admin-home-slide-image" />
                    <div className="admin-home-slide-meta">
                      <p>Slide #{slide.id}</p>
                      <p>Orden: {slide.displayOrder}</p>
                    </div>
                    <button
                      type="button"
                      className="admin-row-action-button admin-row-action-button--danger"
                      onClick={() => void handleDeleteHomeSlide(slide.id)}
                      disabled={isDeletingHomeSlideId === slide.id}
                    >
                      {isDeletingHomeSlideId === slide.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeSection === "ofertas" && (
          <section className="admin-info-panel admin-module-section">
          <div className="admin-panel-header">
            <h2>Ofertas</h2>
            <p>
              Aquí se listan todos los productos en oferta con su precio actual y precio promocional.
              Quitar oferta no borra el producto original.
            </p>
          </div>

          {isLoadingOffers && <p>Cargando ofertas...</p>}
          {!isLoadingOffers && offerError && <p className="admin-auth-error">{offerError}</p>}
          {!isLoadingOffers && !offerError && offers.length === 0 && (
            <p>No hay productos en oferta en este momento.</p>
          )}
          {!isLoadingOffers && !offerError && offers.length > 0 && (
            <div className="admin-table-wrapper admin-surface-card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Precio normal</th>
                    <th>Precio oferta</th>
                    <th>Ahorro</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map((offer) => (
                    <tr key={offer.productId}>
                      <td>{offer.productName}</td>
                      <td>{offer.category}</td>
                      <td>${offer.originalPrice.toFixed(2)}</td>
                      <td>
                        <span className="admin-offer-price">${offer.offerPrice.toFixed(2)}</span>
                      </td>
                      <td>${Math.max(0, offer.originalPrice - offer.offerPrice).toFixed(2)}</td>
                      <td>
                        <button
                          type="button"
                          className="admin-row-action-button admin-row-action-button--danger"
                          onClick={() => void handleRemoveOffer(offer.productId)}
                          disabled={isSavingOfferProductId === offer.productId}
                        >
                          {isSavingOfferProductId === offer.productId ? "Quitando..." : "Quitar oferta"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </section>
        )}

        {activeSection === "ingresos" && (
          <section className="admin-info-panel admin-module-section">
          <div className="admin-panel-header">
            <h2>Ingresos del día</h2>
            <p>
              Muestra ventas totales del día, cantidad de productos vendidos y número total de
              ventas registradas.
            </p>
          </div>

          {isLoadingSales && <p>Cargando ingresos del día...</p>}
          {!isLoadingSales && salesError && <p className="admin-auth-error">{salesError}</p>}
          {!isLoadingSales && !salesError && (
            <>
              {salesMessage && <p className="admin-sidebar-note admin-note-dark">{salesMessage}</p>}
              <div className="admin-sales-summary-grid">
                <article className="admin-surface-card admin-sales-summary-card">
                  <h3>Total vendido hoy</h3>
                  <p>${salesSummary.totalRevenue.toFixed(2)}</p>
                </article>
                <article className="admin-surface-card admin-sales-summary-card">
                  <h3>Unidades vendidas</h3>
                  <p>{salesSummary.totalUnits}</p>
                </article>
                <article className="admin-surface-card admin-sales-summary-card">
                  <h3>Ventas registradas</h3>
                  <p>{salesSummary.totalOrders}</p>
                </article>
              </div>

              {salesByProduct.length === 0 ? (
                <p className="admin-sales-empty">No hay detalle de productos vendidos hoy.</p>
              ) : (
                <div className="admin-table-wrapper admin-surface-card">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Cantidad vendida</th>
                        <th>Ingresos</th>
                        <th>Número de ventas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesByProduct.map((row) => (
                        <tr key={row.productId}>
                          <td>{row.productName}</td>
                          <td>{row.totalUnits}</td>
                          <td>${row.totalRevenue.toFixed(2)}</td>
                          <td>{row.totalOrders}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
          </section>
        )}
      </main>
    </div>
  );
}

