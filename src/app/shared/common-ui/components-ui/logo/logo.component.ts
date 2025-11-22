import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'logo-ui',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logo.component.html',
  styleUrls: ['./logo.component.scss'],
})
export class LogoComponent {
  @Input() size: number = 40;
  @Input() variant: 'default' | 'inverted' | 'monochrome' = 'default';
  @Input() className: string = '';
  @Input() altText: string = 'AlwaysMarket - Ваш надежный маркетплейс';

  get logoSrc(): string {
    return 'assets/images/svg/logo.svg';
  }
}
