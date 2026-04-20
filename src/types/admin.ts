export type AdminBinaryFlag = 0 | 1;
export type AdminHomeCarouselSlot = 0 | 1 | 2 | 3 | 4;

export interface AdminProduct {
  id: number;
  name: string;
  categoryId: number;
  brand?: string;
  price: number;
  stock: number;
  image: string;
  mayoreo: AdminBinaryFlag;
  menudeo: AdminBinaryFlag;
  mayoreoPrice: number | null;
  mayoreoStock: number;
  mayoreoMinQty: number;
  menudeoPrice: number | null;
  menudeoStock: number;
  menudeoMinQty: number;
  lowStockThreshold: number;
  homeCarouselSlot: AdminHomeCarouselSlot;
  category: string;
  isOffer: AdminBinaryFlag;
  offerPrice: number | null;
}

export interface AdminOffer {
  productId: number;
  productName: string;
  category: string;
  originalPrice: number;
  offerPrice: number;
  stock: number;
}

export interface AdminSalesProductRow {
  productId: number;
  productName: string;
  totalUnits: number;
  totalRevenue: number;
  totalOrders: number;
}

export interface AdminOrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  price: number;
}

export interface AdminOrder {
  id: number;
  customerUserId: number | null;
  customerName: string;
  customerEmail: string;
  total: number;
  currency: string;
  status: string;
  createdAt: string;
  items: AdminOrderItem[];
}

export interface AdminSalesTodaySummary {
  totalRevenue: number;
  totalUnits: number;
  totalOrders: number;
}

export interface AdminSalesOrderDetail {
  orderId: number;
  orderTime: string;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface AdminClosingProductDetail {
  product_id: number;
  product_name: string;
  total_units: number;
  total_revenue: number;
  total_orders: number;
}

export interface AdminDailyClosing {
  id: number;
  closingDate: string;
  periodStart: string;
  periodEnd: string;
  totalRevenue: number;
  totalUnits: number;
  totalOrders: number;
  productsDetail: AdminClosingProductDetail[];
  notes: string | null;
  closedAt: string;
}

export interface AdminHomeSlide {
  id: number;
  imageUrl: string;
  isActive: AdminBinaryFlag;
  displayOrder: number;
}

export interface AdminCategory {
  id: number;
  name: string;
  parentId: number | null;
  parentName?: string | null;
  isActive: AdminBinaryFlag;
}

export interface UpdateAdminProductInput {
  id: number;
  categoryId: number;
  name: string;
  brand?: string;
  price: number;
  stock: number;
  imageUrl: string;
  mayoreo: AdminBinaryFlag;
  menudeo: AdminBinaryFlag;
  mayoreoPrice: number | null;
  mayoreoStock: number;
  mayoreoMinQty: number;
  menudeoPrice: number | null;
  menudeoStock: number;
  menudeoMinQty: number;
  lowStockThreshold: number;
  homeCarouselSlot: AdminHomeCarouselSlot;
}

export interface CreateAdminProductInput {
  categoryId: number;
  name: string;
  brand?: string;
  price: number;
  stock: number;
  imageUrl: string;
  mayoreo: AdminBinaryFlag;
  menudeo: AdminBinaryFlag;
  mayoreoPrice: number | null;
  mayoreoStock: number;
  mayoreoMinQty: number;
  menudeoPrice: number | null;
  menudeoStock: number;
  menudeoMinQty: number;
  lowStockThreshold: number;
  homeCarouselSlot: AdminHomeCarouselSlot;
}

export interface DeleteAdminProductInput {
  id: number;
}

export interface UpsertAdminOfferInput {
  productId: number;
  offerPrice: number;
}

export interface RemoveAdminOfferInput {
  productId: number;
}

export interface CreateAdminHomeSlideInput {
  imageUrl: string;
  displayOrder: number;
  isActive?: AdminBinaryFlag;
}

export interface DeleteAdminHomeSlideInput {
  id: number;
}
