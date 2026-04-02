import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { BehaviorSubject, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private baseUrl = environment.woocommerce.url;
  
  private _isAuthenticated = new BehaviorSubject<boolean>(false);
  isAuthenticated = this._isAuthenticated.asObservable();

  constructor() { }

  private getBaseUrl(path: string): string {
    // Si estamos en desarrollo, usamos el proxy configurado en proxy.conf.json
    if (!environment.production) {
      return `/proxy-wc/main${path}`; 
    }
    return `${this.baseUrl}${path}`;
  }

  login(credentials: { username: string; password: string }) {
    return this.http.post(this.getBaseUrl('/wp-json/jwt-auth/v1/token'), credentials).pipe(
      tap((res: any) => {
        localStorage.setItem('access_token', res.token);
        localStorage.setItem('user_name', res.user_display_name || credentials.username);
        this._isAuthenticated.next(true);
      })
    );
  }

  register(userData: any) {
    return this.http.post(this.getBaseUrl('/wp-json/wp/v2/users/register'), userData);
  }

  getCurrentUser() {
    return this.http.get(this.getBaseUrl('/wp-json/wp/v2/users/me'));
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_name');
    this._isAuthenticated.next(false);
  }
}
