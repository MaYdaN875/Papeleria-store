import type { Product } from "./Product";

export interface StoreProductsResponse {
  ok: boolean;
  message?: string;
  products?: Product[];
}

export interface StoreHomeSlide {
  id: number;
  imageUrl: string;
  displayOrder: number;
}

export interface StoreHomeSlidesResponse {
  ok: boolean;
  message?: string;
  slides?: StoreHomeSlide[];
}

export interface StoreCategoryNode {
  id: number;
  name: string;
  children: Array<{
    id: number;
    name: string;
  }>;
}

export interface StoreCategoriesResponse {
  ok: boolean;
  message?: string;
  categories?: StoreCategoryNode[];
}
