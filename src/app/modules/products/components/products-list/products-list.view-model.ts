import {ProductDTO} from '../../models/data-dto/product-dto-model';


export type ProductListVM = {
  products: ProductDTO[]  | null
}

// export type ProductListVM = DeepReadonly<ProductDTO[]>
