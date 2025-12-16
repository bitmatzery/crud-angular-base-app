import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ProductCardComponent} from './product-card.component';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';

describe('ProductCardComponent', () => {
  let component: ProductCardComponent;
  let fixture: ComponentFixture<ProductCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCardComponent);
    component = fixture.componentInstance;

    // Задаем mock данные для продукта
    component.product = {
      id: 1,
      title: 'Test Product',
      description: 'Test Description',
      price: 100,
      category: 'Test Category',
      images: 'test-image.jpg'
    } as any;

    component.quantityInCart = 0;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display product title', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.product-card__title').textContent)
      .toContain('Test Product');
  });

  it('should display product price', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.product-card__price').textContent)
      .toContain('$100');
  });

  it('should emit addToCart event when button is clicked', () => {
    spyOn(component.addToCart, 'emit');
    const button = fixture.nativeElement.querySelector('.add-to-cart-btn');
    button.click();
    expect(component.addToCart.emit).toHaveBeenCalled();
  });
});
