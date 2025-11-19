import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of, Observable, throwError } from 'rxjs';
import { catchError, switchMap, tap, timeout } from 'rxjs/operators';
import { ProductsApiService } from './products-api.service';
import { Category, Product, ProductDTO, CategoryDTO } from '../../models/product.interface';

// Интерфейсы для данных из бэкапа
interface BackupCategory {
  id: number;
  slug: string;
  name: string;
  image: string;
}

interface BackupProduct {
  id: number;
  title: string;
  description: string;
  price: number;
  images: string;
  category_id: string;
  slug: string;
}

interface BackupData {
  categories: BackupCategory[];
  products: BackupProduct[];
}

@Injectable({
  providedIn: 'root'
})
export class DataInitializationService {
  private http = inject(HttpClient);
  private api = inject(ProductsApiService);

  // Флаг для отслеживания процесса инициализации
  private isInitializing = false;
  private initializationAttempted = false;

  // Внешняя ссылка для placeholder
  private readonly PLACEHOLDER_IMAGE = 'https://via.placeholder.com/300x200/EFEFEF/666666?text=No+Image';

  /**
   * Проверяет состояние данных в БД и восстанавливает из резервной копии при необходимости
   */
  initializeData(): Observable<{ success: boolean; message: string }> {
    // Предотвращаем множественные вызовы
    if (this.isInitializing) {
      console.log('Data initialization already in progress');
      return of({ success: true, message: 'Initialization in progress' });
    }

    if (this.initializationAttempted) {
      console.log('Data initialization already attempted');
      return of({ success: true, message: 'Initialization already completed' });
    }

    this.isInitializing = true;
    this.initializationAttempted = true;

    console.log('Starting data initialization check...');

    return this.loadBackupData().pipe(
      switchMap(backupData => {
        return this.checkDatabaseState(backupData).pipe(
          switchMap(({ needsRestore, missingCategories, missingProducts }) => {
            if (needsRestore) {
              console.log('Database needs restoration:', {
                missingCategories,
                missingProducts
              });
              return this.restoreFromBackup(backupData);
            } else {
              console.log('Database is in good state, no restoration needed');
              return of({ success: true, message: 'Database is healthy' });
            }
          })
        );
      }),
      tap(result => {
        this.isInitializing = false;
        console.log('Data initialization completed:', result);
      }),
      catchError(error => {
        this.isInitializing = false;
        console.error('Data initialization failed:', error);
        return of({
          success: false,
          message: `Initialization failed: ${error.message}`
        });
      }),
      timeout(60000) // 60 секунд таймаут на всю операцию
    );
  }

  /**
   * Проверяет состояние базы данных по сравнению с бэкапом
   */
  private checkDatabaseState(backupData: BackupData): Observable<{
    needsRestore: boolean;
    missingCategories: string[];
    missingProducts: string[];
  }> {
    return forkJoin({
      currentCategories: this.api.getCategories(100).pipe(
        catchError(() => of([] as Category[]))
      ),
      currentProducts: this.api.getProducts(100, 0).pipe(
        catchError(() => of([] as Product[]))
      )
    }).pipe(
      switchMap(({ currentCategories, currentProducts }) => {
        console.log('Database check results:', {
          currentCategories: currentCategories.length,
          backupCategories: backupData.categories.length,
          currentProducts: currentProducts.length,
          backupProducts: backupData.products.length
        });

        // Проверяем наличие всех категорий из бэкапа
        const missingCategories = this.findMissingCategories(backupData.categories, currentCategories);

        // Проверяем наличие всех продуктов из бэкапа
        const missingProducts = this.findMissingProducts(backupData.products, currentProducts);

        // Если отсутствует хотя бы одна категория или один продукт - полная замена
        const needsRestore = missingCategories.length > 0 || missingProducts.length > 0;

        console.log('Missing items:', {
          missingCategories: missingCategories.length,
          missingProducts: missingProducts.length,
          needsRestore
        });

        return of({ needsRestore, missingCategories, missingProducts });
      }),
      catchError(error => {
        console.error('Error checking database state:', error);
        // Если не можем проверить БД, считаем что нужно восстановление
        return of({
          needsRestore: true,
          missingCategories: ['All'],
          missingProducts: ['All']
        });
      })
    );
  }

  /**
   * Находит отсутствующие категории
   */
  private findMissingCategories(backupCategories: BackupCategory[], currentCategories: Category[]): string[] {
    const missing: string[] = [];

    backupCategories.forEach(backupCat => {
      const exists = currentCategories.some(currentCat =>
        currentCat.name.toLowerCase() === backupCat.name.toLowerCase()
      );

      if (!exists) {
        missing.push(backupCat.name);
      }
    });

    return missing;
  }

  /**
   * Находит отсутствующие продукты
   */
  private findMissingProducts(backupProducts: BackupProduct[], currentProducts: Product[]): string[] {
    const missing: string[] = [];

    backupProducts.forEach(backupProd => {
      const exists = currentProducts.some(currentProd =>
        currentProd.title.toLowerCase() === backupProd.title.toLowerCase()
      );

      if (!exists) {
        missing.push(backupProd.title);
      }
    });

    return missing;
  }

  /**
   * Восстанавливает данные из резервной копии
   */
  private restoreFromBackup(backupData: BackupData): Observable<{ success: boolean; message: string }> {
    console.log('Starting COMPLETE database restoration from backup...');

    // Полностью заменяем данные - сначала категории, потом продукты
    return this.restoreCategories(backupData.categories).pipe(
      switchMap(categoryMapping => {
        console.log('Categories restored, mapping:', categoryMapping);
        return this.restoreProducts(backupData.products, categoryMapping);
      }),
      switchMap(restorationResult => {
        const success = restorationResult.productsCreated > 0;
        const message = success
          ? `Полностью восстановлено: ${restorationResult.categoriesCreated} категорий и ${restorationResult.productsCreated} продуктов`
          : 'Не удалось восстановить данные';

        return of({ success, message });
      }),
      catchError(error => {
        console.error('Failed to restore from backup:', error);
        return of({
          success: false,
          message: `Восстановление не удалось: ${error.message}`
        });
      })
    );
  }

  /**
   * Восстанавливает категории (полная замена)
   */
  private restoreCategories(backupCategories: BackupCategory[]): Observable<{ [oldCategoryId: string]: number }> {
    console.log('Starting COMPLETE categories restoration...');

    // Сначала получаем существующие категории для удаления
    return this.api.getCategories(100).pipe(
      catchError(() => of([] as Category[])),
      switchMap(existingCategories => {
        // Удаляем существующие категории
        const deleteRequests = existingCategories.map(category =>
          this.api.deleteCategory(category.id).pipe(
            catchError(error => {
              console.warn(`Could not delete category ${category.name}:`, error);
              return of(null);
            })
          )
        );

        return deleteRequests.length > 0
          ? forkJoin(deleteRequests).pipe(switchMap(() => this.createNewCategories(backupCategories)))
          : this.createNewCategories(backupCategories);
      })
    );
  }

  /**
   * Создает новые категории из бэкапа
   */
  private createNewCategories(backupCategories: BackupCategory[]): Observable<{ [oldCategoryId: string]: number }> {
    console.log('Creating new categories from backup...');

    const categoryRequests = backupCategories.map(backupCategory => {
      const categoryData: CategoryDTO = {
        name: backupCategory.name,
        image: backupCategory.image || this.PLACEHOLDER_IMAGE
      };

      return this.api.createCategory(categoryData).pipe(
        tap(newCategory => {
          console.log(`✓ Created category: ${newCategory.name} (ID: ${newCategory.id})`);
        }),
        catchError(error => {
          console.error(`✗ Failed to create category ${backupCategory.name}:`, error);
          return of(null);
        })
      );
    });

    return forkJoin(categoryRequests).pipe(
      switchMap(createdCategories => {
        const successfulCategories = createdCategories.filter(Boolean) as Category[];
        console.log(`Successfully created ${successfulCategories.length} categories`);

        // Создаем маппинг старых ID категорий на новые
        const categoryMapping: { [oldCategoryId: string]: number } = {};

        backupCategories.forEach((backupCategory, index) => {
          if (successfulCategories[index]) {
            categoryMapping[backupCategory.id.toString()] = successfulCategories[index].id;
          }
        });

        console.log('Category mapping created:', categoryMapping);
        return of(categoryMapping);
      })
    );
  }

  /**
   * Восстанавливает продукты (полная замена)
   */
  private restoreProducts(
    backupProducts: BackupProduct[],
    categoryMapping: { [oldCategoryId: string]: number }
  ): Observable<{ categoriesCreated: number; productsCreated: number }> {
    console.log('Starting COMPLETE products restoration...');

    // Сначала получаем существующие продукты для удаления
    return this.api.getProducts(200, 0).pipe(
      catchError(() => of([] as Product[])),
      switchMap(existingProducts => {
        // Удаляем существующие продукты
        const deleteRequests = existingProducts.map(product =>
          this.api.deleteProduct(product.id).pipe(
            catchError(error => {
              console.warn(`Could not delete product ${product.title}:`, error);
              return of(null);
            })
          )
        );

        return deleteRequests.length > 0
          ? forkJoin(deleteRequests).pipe(switchMap(() => this.createNewProducts(backupProducts, categoryMapping)))
          : this.createNewProducts(backupProducts, categoryMapping);
      })
    );
  }

  /**
   * Создает новые продукты из бэкапа
   */
  private createNewProducts(
    backupProducts: BackupProduct[],
    categoryMapping: { [oldCategoryId: string]: number }
  ): Observable<{ categoriesCreated: number; productsCreated: number }> {
    console.log('Creating new products from backup...');

    const productRequests = backupProducts.map(backupProduct => {
      const newCategoryId = categoryMapping[backupProduct.category_id];

      if (!newCategoryId) {
        console.warn(`✗ No category mapping found for product: ${backupProduct.title}, category_id: ${backupProduct.category_id}`);
        return of(null);
      }

      // Преобразуем images из строки в массив
      const imagesArray = this.parseImages(backupProduct.images);

      const productData: ProductDTO = {
        title: backupProduct.title,
        price: backupProduct.price,
        description: backupProduct.description,
        categoryId: newCategoryId,
        images: imagesArray
      };

      return this.api.createProduct(productData).pipe(
        tap(newProduct => {
          console.log(`✓ Created product: ${newProduct.title}`);
        }),
        catchError(error => {
          console.error(`✗ Failed to create product ${backupProduct.title}:`, error);
          return of(null);
        })
      );
    });

    return forkJoin(productRequests).pipe(
      switchMap(createdProducts => {
        const successfulProducts = createdProducts.filter(Boolean);
        console.log(`Successfully created ${successfulProducts.length} products`);

        return of({
          categoriesCreated: Object.keys(categoryMapping).length,
          productsCreated: successfulProducts.length
        });
      })
    );
  }

  /**
   * Загружает данные из резервных копий
   */
  private loadBackupData(): Observable<BackupData> {
    return forkJoin({
      categories: this.http.get<BackupCategory[]>('dataset/categories.json').pipe(
        catchError((error) => {
          console.error('Failed to load categories backup:', error);
          console.log('Using fallback categories...');
          return of(this.getFallbackCategories());
        })
      ),
      products: this.http.get<BackupProduct[]>('dataset/products.json').pipe(
        catchError((error) => {
          console.error('Failed to load products backup:', error);
          console.log('Using fallback products...');
          return of(this.getFallbackProducts());
        })
      )
    }).pipe(
      tap(data => {
        console.log('Backup data loaded:', {
          categories: data.categories.length,
          products: data.products.length
        });
      })
    );
  }

  /**
   * Парсит строку с изображениями в массив
   */
  private parseImages(imagesString: string): string[] {
    if (!imagesString || typeof imagesString !== 'string') {
      return [this.PLACEHOLDER_IMAGE];
    }

    // Разделяем строку по запятым и убираем пробелы
    const images = imagesString.split(',').map(img => img.trim()).filter(img => img.length > 0);

    // Если нет изображений, используем placeholder
    return images.length > 0 ? images : [this.PLACEHOLDER_IMAGE];
  }

  /**
   * Фолбэк категории если файл не загрузился
   */
  private getFallbackCategories(): BackupCategory[] {
    return [
      {
        id: 1,
        slug: "clothes",
        name: "Clothes",
        image: "https://i.imgur.com/QkIa5tT.jpeg"
      },
      {
        id: 2,
        slug: "electronics",
        name: "Electronics",
        image: "https://i.imgur.com/ZANVnHE.jpeg"
      },
      {
        id: 3,
        slug: "furniture",
        name: "Furniture",
        image: "https://i.imgur.com/Qphac99.jpeg"
      },
      {
        id: 4,
        slug: "shoes",
        name: "Shoes",
        image: "https://i.imgur.com/qNOjJje.jpeg"
      },
      {
        id: 5,
        slug: "miscellaneous",
        name: "Miscellaneous",
        image: "https://i.imgur.com/BG8J0Fj.jpg"
      }
    ];
  }

  /**
   * Фолбэк продукты если файл не загрузился
   */
  private getFallbackProducts(): BackupProduct[] {
    return [
      {
        id: 1,
        title: "Majestic Mountain Graphic T-Shirt",
        price: 44,
        description: "Elevate your wardrobe with this stylish black t-shirt...",
        images: "https://i.imgur.com/QkIa5tT.jpeg,https://i.imgur.com/jb5Yu0h.jpeg,https://i.imgur.com/UlxxXyG.jpeg",
        category_id: "1",
        slug: "majestic-mountain-graphic-t-shirt"
      },
      {
        id: 2,
        title: "Classic Red Pullover Hoodie",
        price: 10,
        description: "Elevate your casual wardrobe with our Classic Red Pullover Hoodie...",
        images: "https://i.imgur.com/1twoaDy.jpeg,https://i.imgur.com/FDwQgLy.jpeg,https://i.imgur.com/kg1ZhhH.jpeg",
        category_id: "1",
        slug: "classic-red-pullover-hoodie"
      }
    ];
  }

  /**
   * Сбрасывает флаги инициализации (для тестирования)
   */
  resetInitialization(): void {
    this.isInitializing = false;
    this.initializationAttempted = false;
  }
}
