import {
  ChangeDetectionStrategy,
  Component, EventEmitter, inject, OnInit, Output,
  ViewEncapsulation
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import {first} from 'rxjs';

@Component({
  selector: 'search-filtration-items-ui',
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatTooltipModule],
  templateUrl: './search-filtration-items.component.html',
  styleUrls: ['./search-filtration-items.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchFiltrationItemsComponent implements OnInit {
  @Output() filterItems = new EventEmitter();

  private readonly route = inject(ActivatedRoute); // Доступ к параметрам маршрута

  protected filterName = '';


  ngOnInit() {
    this.route.queryParams.pipe(first()).subscribe(params => {
      const filterParam: string = params['search'];
      if (filterParam) {
        this.filterName = filterParam
      }
    });
  }

  OnFilteredItems() {
    if (!this.filterName.trim()) {
      this.clearFilterName();
      return;
    }
    this.filterItems.emit(this.filterName.trim());
  }

  clearFilterName() {
    this.filterName = '';
    this.filterItems.emit(this.filterName.trim());
  }
}
