import { Product, Category, ProductFilters, PaginationInfo } from '../models/product.interface';

export interface ProductState {
  // Products
  products: Product[];
  filteredProducts: Product[];
  currentProduct: Product | null;

  // Categories
  categories: Category[];
  selectedCategory: Category | null;

  // Loading states
  loading: boolean;
  loadingProducts: boolean;
  loadingCategories: boolean;

  // Pagination & Filters
  filters: ProductFilters;
  pagination: PaginationInfo;

  // Errors
  error: string | null;
}

export const initialProductState: ProductState = {
  products: [],
  filteredProducts: [],
  currentProduct: null,
  categories: [],
  selectedCategory: null,
  loading: false,
  loadingProducts: false,
  loadingCategories: false,
  filters: {
    limit: 20,
    offset: 0
  },
  pagination: {
    limit: 18,
    offset: 0,
    total: 0,
    hasMore: false
  },
  error: null
};
