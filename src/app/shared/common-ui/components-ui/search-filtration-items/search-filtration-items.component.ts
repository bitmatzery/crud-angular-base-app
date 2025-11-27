import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewEncapsulation
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatTooltipModule} from '@angular/material/tooltip';
import {first, takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {ProductsService} from '../../../../modules/products/services/data-services/products.service';


@Component({
  selector: 'search-filtration-items-ui',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTooltipModule],
  templateUrl: './search-filtration-items.component.html',
  styleUrls: ['./search-filtration-items.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchFiltrationItemsComponent implements OnInit, OnChanges, OnDestroy {
  @Input() searchTerm: string = '';
  @Output() filterItems = new EventEmitter<string>();

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productsService = inject(ProductsService); // Добавляем ProductsService

  private destroy$ = new Subject<void>();

  protected filterName = '';

  ngOnInit() {
    // Восстанавливаем значение из ProductsService
    const savedSearchTerm = this.productsService.getCurrentSearchTerm();
    if (savedSearchTerm) {
      this.filterName = savedSearchTerm;
    } else {
      // Если в сервисе нет значения, используем Input или queryParams
      this.filterName = this.searchTerm;
    }

    // Подписываемся на изменения поискового запроса в сервисе
    this.productsService.currentSearchTerm$
      .pipe(takeUntil(this.destroy$))
      .subscribe(searchTerm => {
        if (searchTerm !== this.filterName) {
          this.filterName = searchTerm;
        }
      });

    // Дополнительно читаем queryParams для начальной установки
    this.route.queryParams.pipe(first()).subscribe(params => {
      const filterParam: string = params['search'] || '';
      if (filterParam && !this.filterName) {
        this.filterName = filterParam;
        // Сохраняем в сервисе
        this.productsService.setCurrentSearchTerm(this.filterName);
        // Автоматически эмитим событие если есть параметр поиска в URL
        setTimeout(() => {
          this.filterItems.emit(this.filterName.trim());
        }, 0);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    // Обновляем filterName при изменении Input searchTerm
    if (changes['searchTerm'] && changes['searchTerm'].currentValue !== this.filterName) {
      this.filterName = changes['searchTerm'].currentValue;
      // Сохраняем в сервисе
      this.productsService.setCurrentSearchTerm(this.filterName);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFilteredItems() {
    const searchTerm = this.filterName.trim();

    if (!searchTerm) {
      this.clearFilterName();
      return;
    }

    console.log('SearchFiltrationItems: Emitting search term:', searchTerm);

    // Сохраняем в сервисе
    this.productsService.setCurrentSearchTerm(searchTerm);

    this.filterItems.emit(searchTerm);

    // Обновляем URL с поисковым запросом
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {search: searchTerm},
      queryParamsHandling: 'merge'
    });
  }

  clearFilterName() {
    this.filterName = '';
    console.log('SearchFiltrationItems: Clearing search');

    // Сбрасываем в сервисе
    this.productsService.setCurrentSearchTerm('');

    this.filterItems.emit('');

    // Убираем поиск из URL
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {search: null},
      queryParamsHandling: 'merge'
    });
  }
}
