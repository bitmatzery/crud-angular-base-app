import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';
import { Subscription } from 'rxjs';
import {ProductsListContainerComponent} from '@store/products';
import {ProductsService} from '../../../products/services/data-services/products.service';
import {DisplayType} from '../../../products/models/display-type.enum';

@Component({
  selector: 'store-home',
  imports: [CommonModule, ProductsListContainerComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit, OnDestroy {
  private productsService = inject(ProductsService);
  private initSubscription?: Subscription;

  protected readonly displayType = DisplayType;
  protected initializationError = false;
  protected initializationMessage = '';
  protected isRecovering = false;

  ngOnInit(): void {
    console.log('HomeComponent initialized');
    this.initializeApp();
  }

  ngOnDestroy(): void {
    this.initSubscription?.unsubscribe();
  }

  private initializeApp(): void {
    this.initializationError = false;
    this.initializationMessage = 'Проверка и загрузка данных...';

    this.initSubscription = this.productsService.initializeApp().subscribe({
      next: (success) => {
        if (success) {
          this.initializationMessage = '';
          console.log('HomeComponent: Application initialized successfully');
        } else {
          this.initializationError = true;
          this.initializationMessage = 'Не удалось загрузить данные. Некоторые функции могут быть недоступны.';
        }
      },
      error: (error) => {
        this.initializationError = true;
        this.initializationMessage = 'Критическая ошибка инициализации. Пожалуйста, обновите страницу.';
        console.error('HomeComponent: Initialization failed:', error);
      }
    });
  }

  retryInitialization(): void {
    this.initializationMessage = 'Повторная попытка загрузки...';
    this.initializationError = false;
    this.initializeApp();
  }

  forceDataRecovery(): void {
    this.isRecovering = true;
    this.initializationMessage = 'Восстановление данных из резервной копии...';
    this.initializationError = false;

    this.productsService.forceDataRecovery().subscribe({
      next: (success) => {
        this.isRecovering = false;
        if (success) {
          this.initializationError = false;
          this.initializationMessage = 'Данные успешно восстановлены!';
          setTimeout(() => {
            this.initializationMessage = '';
          }, 3000);
        } else {
          this.initializationError = true;
          this.initializationMessage = 'Не удалось восстановить данные.';
        }
      },
      error: (error) => {
        this.isRecovering = false;
        this.initializationError = true;
        this.initializationMessage = 'Ошибка при восстановлении данных.';
        console.error('Force recovery failed:', error);
      }
    });
  }
}
