import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit} from '@angular/core';
import {AsyncPipe, CommonModule} from '@angular/common';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatButtonModule} from '@angular/material/button';
import {Router, RouterLink} from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import {MatListModule} from '@angular/material/list';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {AuthService} from '../../../../core/auth/auth.service'
import {AccessAttemptLog, LogService} from '../../../../core/auth/log.service';

@Component({
  selector: 'header-navbar-ui',
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    RouterLink,
    MatIconModule,
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    FormsModule,
    AsyncPipe
  ],
  templateUrl: './header-navbar.component.html',
  styleUrls: ['./header-navbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderNavbarComponent implements OnInit {
  authService = inject(AuthService);

  isLoggedIn$ = this.authService.isAuth$;
  userEmail$ = this.authService.userEmail$;

  logService = inject(LogService);

  private cdr = inject(ChangeDetectorRef);

  form = new FormGroup({
    email: new FormControl<string>('', [Validators.required, Validators.email]),
    password: new FormControl<string>('', [Validators.required])
  });

  ngOnInit() {
    // Просмотреть логи попыток доступа
    const accessLogs = this.logService.getLogs();
    this.logService.printLogs();
  }

  // Пример метода для отображения логов в шаблоне
  formatLogEntry(log: AccessAttemptLog): string {
    return `${log.email || 'Guest'} tried to access ${log.targetUrl} at ${new Date(log.timestamp).toLocaleString()}`;
  }

  onSubmit() {
    if (this.form.valid) {
      const credentials = {
        email: this.form.value.email ?? '',
        password: this.form.value.password ?? ''
      };

      this.authService.login(credentials).subscribe({
        next: () => {
          // После успешного логина очищаем форму
          this.form.reset();
        },
        error: (error) => {
          console.error('Login failed:', error);
        }
      });
    }
  }

  onLogout() {
    this.authService.logout();
  }
}

