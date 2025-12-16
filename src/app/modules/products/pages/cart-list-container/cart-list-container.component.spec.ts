import {ComponentFixture, TestBed} from '@angular/core/testing';

import {CartListContainerComponent} from './cart-list-container.component';

describe('CartListContainerComponent', () => {
  let component: CartListContainerComponent;
  let fixture: ComponentFixture<CartListContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartListContainerComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CartListContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
