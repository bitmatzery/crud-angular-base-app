import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewEncapsulation
} from '@angular/core';
import {AsyncPipe, CommonModule} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {BehaviorSubject, first, firstValueFrom, map, Observable, of, switchMap} from 'rxjs';
import {DisplayType} from '../../models/data-dto/display-type.enum';
import {ProductsService} from '../../services/data-services/products.service';
import {CategoryDTO, ProductDTO} from '../../models/data-dto/product-dto-model';
import {ProductsListComponent} from '../../components/products-list/products-list.component';


@Component({
  selector: 'product-list-container',
  imports: [CommonModule, ProductsListComponent, AsyncPipe],
  templateUrl: './products-list-container.component.html',
  styleUrls: ['./products-list-container.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductsListContainerComponent implements OnInit, OnChanges {
  @Input() displayType: DisplayType = DisplayType.PRODUCTS;

  protected displayListType: DisplayType = this.displayType;

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute); // Доступ к параметрам маршрута
  productsService = inject(ProductsService);


  public products$: Observable<ProductDTO[]> = this.productsService.getProducts(22);
  public categories$: Observable<CategoryDTO[]> = this.productsService.getCategories();

  private filterParamsSubject = new BehaviorSubject<string>('');

  public items$: Observable<ProductDTO[] | CategoryDTO[]> =
    this.displayType === DisplayType.PRODUCTS
      ? this.products$
      : this.categories$;

  // Отфильтрованные продукты
  public filteredItems$ = this.filterParamsSubject.asObservable().pipe(
    switchMap(filterParams => this.filterItems(filterParams))
  );

  protected displayType$ =
    this.route.data.pipe(switchMap(data => of(data['displayType'] as DisplayType)));

  // Получаем категорию из отфильтрованных продуктов
  private categoryFilteredItem$ = this.filteredItems$.pipe(
    map(items => {
      if (Array.isArray(items) && items.length > 0 && 'category' in items[0]) {
        return (items as ProductDTO[])[0].category.name;
      }
      return null;
    })
  );

  ngOnInit() {
    // Проверяем маршрут, если он содержит DisplayType меняем значение displayType на значение из маршрута
    this.displayType$.pipe(first()).subscribe(displayType => {
      if (displayType === DisplayType.PRODUCTS || displayType === DisplayType.CATEGORIES) {
        this.displayType = displayType;
        this.updateItems(); // Обновляем элементы после изменения displayType
      }
      // взять queryParams при загрузке компонента и передать в навигацию, если они есть
      this.route.queryParams.pipe(first()).subscribe(params => {
        const filterParam = params['search'];
        const rout = params['rout'];
        const category = params['category'];
        if (filterParam) {
          this.onFilteredItemsAndNavigate(filterParam, rout, category);
        }
      });
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['displayType']) {
      this.updateItems();
    }
  }

  private updateItems() {
    // Update items$ based on the displayType
    this.items$ = this.displayType === DisplayType.PRODUCTS
      ? this.products$
      : this.categories$;
    this.displayListType = this.displayType;
  }

  // // для получения названия категории для асинхронной getCategoryName()
  // private getCategoryNameFromItems(items: ProductDTO[] | CategoryDTO[]): string | null {
  //   if (Array.isArray(items) && items.length > 0 && 'category' in items[0]) {
  //     return (items as ProductDTO[])[0].category.name;
  //   }
  //   return null;
  // }
  // // для получения категории промисом
  // private async getCategoryName(): Promise<string | null> {
  //   const items = await firstValueFrom(this.filteredItems$);
  //   return this.getCategoryNameFromItems(items);
  // }

  // Обработка параметров фильтрации продуктов и параметров навигации, и навигация
  async onFilteredItemsAndNavigate(filterParam: string, routQP: string = 'null', categoryQP: string | null = 'null') {
    console.log(`Filter Params = `, filterParam); // Просто логируем параметры фильтрации

    // Обновляем параметры фильтрации
    this.filterParamsSubject.next(filterParam);

    // Определяем текущий маршрут
    const currentRoute = this.route.snapshot.url.map(segment => segment.path).join('/');

    // Получаем значение категории
    const category = await firstValueFrom(this.categoryFilteredItem$);

    routQP === 'null' ? routQP = DisplayType.PRODUCTS : routQP;
    categoryQP === 'null' ? categoryQP = category : categoryQP;

    // Навигация с корректными параметрами
    // c /home фильтровал по продуктам, а не переходил на /products, к тому же без фильтрации
    filterParam === ''
      ? currentRoute === 'home'
        ? this.router.navigate([])
        : this.router.navigate([`/${this.displayType}`])

      // this.displayType заменён на DisplayType.PRODUCTS, т.к. фильтрация только по продуктам
      : currentRoute === 'home'
        ? this.router.navigate([],
          {
            queryParams: {
              rout: routQP,
              category: categoryQP,
              search: filterParam,
              queryParamsHandling: 'merge'
            }
          })
        : this.router.navigate([`/${DisplayType.PRODUCTS}`],
          {
            queryParams: {
              rout: routQP,
              category: categoryQP,
              search: filterParam,
              queryParamsHandling: 'merge'
            }
          });
  }

  private filterItems(filterParam: string): Observable<ProductDTO[] | CategoryDTO[]> {
    return this.items$.pipe(
      map((items: ProductDTO[] | CategoryDTO[]) => {
        // Поиск всегда только по PRODUCTS
        //if (this.displayType === DisplayType.PRODUCTS) {
        return (items as ProductDTO[]).filter(item => this.itemMatchesFilter(item, filterParam));
        //} else {
        //return (items as CategoryDTO[]).filter(item => this.itemMatchesFilter(item, filterParam));
        //}
      })
    );
  }

  private itemMatchesFilter(product: ProductDTO | CategoryDTO, filterParam: string): boolean {
    // Рекурсивная функция для извлечения строковых значений из вложенных объектов
    const extractValues = (obj: any): string[] => {
      return Object.values(obj).flatMap(value =>
        typeof value === 'string' && value.toLowerCase().includes(filterParam.toLowerCase())
          ? [value] // Если строка — добавляем в результат
          : typeof value === 'number' && value === +filterParam
            ? [value.toString()] // Если число — преобразуем в строку и добавляем
            : value && typeof value === 'object'
              ? extractValues(value) // Если объект — углубляемся
              : [] // Иначе игнорируем
      );
    };

    // Извлекаем все строки из объекта product (включая вложенные свойства)
    const valuesToCheck = extractValues(product);
    return valuesToCheck.length > 0;
  }

  onCategorySelect(event: Event) {

  }
}
