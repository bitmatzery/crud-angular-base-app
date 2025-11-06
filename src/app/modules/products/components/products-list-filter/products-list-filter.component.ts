import {
  ChangeDetectionStrategy,
  Component, EventEmitter, inject, Output,
  ViewEncapsulation
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'lib-products-list-filter-ui',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './products-list-filter.component.html',
  styleUrls: ['./products-list-filter.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsListFilterComponent {
  @Output() filterItems = new EventEmitter();
  protected filterName = '';
  private readonly router = inject(Router);

  OnFilteredItems() {
    this.filterItems.emit(this.filterName);
  }

  clearFilterName() {
    this.filterName = '';
    this.filterItems.emit(this.filterName);
    // this.router.navigate(['/products']);
  }
}
