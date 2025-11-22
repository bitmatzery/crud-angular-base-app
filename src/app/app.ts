import {Component, signal} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {HeaderComponent} from './shared/common-ui/layout-ui/header/header.component';
import {FooterComponent} from './shared/common-ui/layout-ui/footer/footer.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('crud-angular-base-app');
}
