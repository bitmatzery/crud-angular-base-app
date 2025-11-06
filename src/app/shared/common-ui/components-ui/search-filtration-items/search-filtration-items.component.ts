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
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'search-filtration-items-ui',
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatTooltipModule],
  templateUrl: './search-filtration-items.component.html',
  styleUrls: ['./search-filtration-items.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchFiltrationItemsComponent {
  @Output() filterItems = new EventEmitter();
  protected filterName = '';
  private readonly router = inject(Router);

  OnFilteredItems() {
    this.filterItems.emit(this.filterName);
  }

  clearFilterName() {
    this.filterName = '';
    this.filterItems.emit(this.filterName);
  }
}
