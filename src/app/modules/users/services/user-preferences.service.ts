import { Injectable, inject } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserPreferencesService {
  private readonly PREF_COOKIE_KEY = 'user_preferences';
  private cookieService = inject(CookieService);
  private receiveAdsSubject = new BehaviorSubject<boolean>(this.getReceiveAds());

  receiveAds$ = this.receiveAdsSubject.asObservable();

  private getReceiveAds(): boolean {
    const prefsJson = this.cookieService.get(this.PREF_COOKIE_KEY);
    if (prefsJson) {
      try {
        const prefs = JSON.parse(prefsJson);
        return prefs.receiveAds ?? false;
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  setReceiveAds(value: boolean): void {
    const prefs = { receiveAds: value };
    this.cookieService.set(this.PREF_COOKIE_KEY, JSON.stringify(prefs), 365, '/');
    this.receiveAdsSubject.next(value);
  }
}
