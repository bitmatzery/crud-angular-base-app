import {Product} from '../../models/product.interface';


export type ProductListVM = {
  products: Product[]  | null
}

// export type ProductListVM = DeepReadonly<ProductDTO[]>
