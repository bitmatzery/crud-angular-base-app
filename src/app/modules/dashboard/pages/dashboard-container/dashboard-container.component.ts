import {Component, ViewEncapsulation} from '@angular/core';
import {Router} from '@angular/router';


@Component({
  selector: 'dashboard-container-ui',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './dashboard-container.component.html',
  styleUrl: './dashboard-container.component.scss',
})
export class DashboardContainerComponent {

  constructor(private router: Router) {
  }

  navigateToProducts(): void {
    this.router.navigate(['/dashboard/products']);
  }

  navigateToUsers(): void {
    this.router.navigate(['/dashboard/users']);
  }
}
