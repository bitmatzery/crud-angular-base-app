import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductsListContainerComponent } from './products-list-container.component';

describe('ProductListContainerComponent', () => {
  let component: ProductsListContainerComponent;
  let fixture: ComponentFixture<ProductsListContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductsListContainerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductsListContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
