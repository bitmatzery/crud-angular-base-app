import {Component, ViewEncapsulation} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatIconModule} from '@angular/material/icon';
import {HeaderNavbarComponent} from '../../components-ui/header-navbar/header-navbar.component';

@Component({
  selector: 'header-ui',
  imports: [CommonModule, MatButtonModule, MatToolbarModule, MatIconModule, HeaderNavbarComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class HeaderComponent {}
