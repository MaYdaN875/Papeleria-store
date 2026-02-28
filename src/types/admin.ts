export type AdminBinaryFlag = 0 | 1;
export type AdminHomeCarouselSlot = 0 | 1 | 2 | 3;

export interface AdminProduct {
  id: number;
  name: string;
  categoryId: number;
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

export interface AdminSalesTodaySummary {
  totalRevenue: number;
  totalUnits: number;
  totalOrders: number;
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
  isActive: AdminBinaryFlag;
}

export interface UpdateAdminProductInput {
  id: number;
  name: string;
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
  homeCarouselSlot: AdminHomeCarouselSlot;
}

export interface CreateAdminProductInput {
  categoryId: number;
  name: string;
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
