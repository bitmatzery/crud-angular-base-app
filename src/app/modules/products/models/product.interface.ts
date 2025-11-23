export interface IProduct {
  id: number;
  title: string;
  slug: string;
  price: number;
  description: string;
  images: string[];
  creationAt: string;
  updatedAt: string;
  category: ICategory;
}

export interface IProductUpdateDTO {
  title: string;
  price: number;
  description: string;
  categoryId: number;
  images: string[];
}

export interface ICategory {
  id: number;
  name: string;
  slug: string;
  image: string;
  creationAt: string;
  updatedAt: string;
}

export interface ICategoryUpdateDTO {
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
