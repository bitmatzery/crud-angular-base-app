export interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  images: string[];
  creationAt: string;
  updatedAt: string;
  category: Category;
}

export interface ProductDTO {
  title: string;
  price: number;
  description: string;
  categoryId: number;
  images: string[];
}

export interface Category {
  id: number;
  name: string;
  image: string;
  creationAt: string;
  updatedAt: string;
}

export interface CategoryDTO {
  name: string;
  image: string;
}

export interface ProductFilters {
  categoryId?: number;
  limit?: number;
  offset?: number;
  search?: string;
}

export interface PaginationInfo {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}
