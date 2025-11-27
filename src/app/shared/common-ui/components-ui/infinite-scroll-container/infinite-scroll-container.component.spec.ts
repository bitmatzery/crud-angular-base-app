import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfiniteScrollContainerComponent } from './infinite-scroll-container.component';

describe('InfiniteScrollContainerComponent', () => {
  let component: InfiniteScrollContainerComponent;
  let fixture: ComponentFixture<InfiniteScrollContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfiniteScrollContainerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InfiniteScrollContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
