import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductsListFilterComponent } from './products-list-filter.component';

describe('ProductsListFilterComponent', () => {
  let component: ProductsListFilterComponent;
  let fixture: ComponentFixture<ProductsListFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductsListFilterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductsListFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
