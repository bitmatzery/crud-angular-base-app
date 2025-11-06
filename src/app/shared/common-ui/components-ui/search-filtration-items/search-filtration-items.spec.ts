import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchFiltrationItemsComponent } from './search-filtration-items.component';

describe('ProductsListFilterComponent', () => {
  let component: SearchFiltrationItemsComponent;
  let fixture: ComponentFixture<SearchFiltrationItemsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchFiltrationItemsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchFiltrationItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
