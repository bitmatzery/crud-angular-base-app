import {IProduct} from '../../models/product.interface';


export type ProductListVM = {
  products: IProduct[]  | null
}

// export type ProductListVM = DeepReadonly<ProductDTO[]>
