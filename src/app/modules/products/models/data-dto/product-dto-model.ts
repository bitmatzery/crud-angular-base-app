export type ProductDTO = {
  id: number;
  title: string;
  price: number;
  description: string;
  images: string[];
  creationAt: string;
  updatedAt: string;
  category: Category
}

export interface Category {
  id: number;
  name: string;
  image: string;
  creationAt: string;
  updatedAt: string;
}


export type CategoryDTO = {
  id: number;
  name: string;
  image: string;
  creationAt: string;
  updatedAt: string;
}
