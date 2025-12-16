import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ProductsListComponent} from './products-list.component';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import {CartService} from '../../../../core/cart/cart.service';
import {of} from 'rxjs';

describe('ProductsListComponent', () => {
  let component: ProductsListComponent;
  let fixture: ComponentFixture<ProductsListComponent>;
  let mockCartService: jasmine.SpyObj<CartService>;

  beforeEach(async () => {
    mockCartService = jasmine.createSpyObj('CartService', [
      'addToCart',
      'updateQuantity',
      'removeFromCart'
    ]);

    mockCartService.cartItems$ = of([]);

    await TestBed.configureTestingModule({
      imports: [ProductsListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {provide: CartService, useValue: mockCartService}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductsListComponent);
    component = fixture.componentInstance;

    // Задаем mock данные
    component.items = [
      {
        id: 1,
        title: 'Test Product',
        description: 'Test Description',
        price: 100,
        category: 'Test Category',
        images: 'test-image.jpg'
      } as any
    ];

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display product card', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('product-card-ui')).toBeTruthy();
  });

  it('should call cartService when adding to cart', () => {
    component.onAddToCart(1);
    expect(mockCartService.addToCart).toHaveBeenCalledWith(1);
  });
});
