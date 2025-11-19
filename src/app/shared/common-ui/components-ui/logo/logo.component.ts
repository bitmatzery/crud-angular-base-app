import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="logo-container" [class]="className" [style.height.px]="size">
      <img
        [src]="logoSrc"
        [alt]="altText"
        [style.height.px]="size"
        class="logo-image"
        [class.inverted]="variant === 'inverted'"
        [class.monochrome]="variant === 'monochrome'"
      />
    </div>
  `,
  styles: [`
    .logo-container {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }

    .logo-image {
      width: auto;
      transition: all 0.3s ease;

      &.inverted {
        filter: brightness(0) invert(1);
      }

      &.monochrome {
        filter: grayscale(1) brightness(0.8);
      }
    }
  `]
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
