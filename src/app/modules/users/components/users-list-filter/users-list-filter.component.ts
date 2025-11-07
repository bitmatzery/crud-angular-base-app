import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  OnInit,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {CommonModule} from '@angular/common';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {FormsModule} from '@angular/forms';
import {MatTooltipModule} from '@angular/material/tooltip';
import {first} from 'rxjs';

@Component({
  selector: 'users-list-filter',
  standalone: true,
  templateUrl: './users-list-filter.component.html',
  styleUrls: ['./users-list-filter.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    MatTooltipModule
  ]
})

export class UsersListFilterComponent implements OnInit {
  @Output() filterUsers = new EventEmitter();
  protected filterName = '';
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute); // Доступ к параметрам маршрута

  ngOnInit() {
    this.route.queryParams.pipe(first()).subscribe(params => {
      const filterParam: string = params['search'];
      if (filterParam) {
        this.filterName = filterParam
      }
    });
  }

  OnFilteredUsers(): void {
    if (!this.filterName.trim()) {
      this.clearFilterName();
      return;
    }
    this.filterUsers.emit(this.filterName.trim());
  }

  clearFilterName() {
    this.filterName = '';
    this.filterUsers.emit(this.filterName.trim());
    this.router.navigate(['/users']);
  }
}
