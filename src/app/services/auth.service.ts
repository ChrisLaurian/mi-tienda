import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { BehaviorSubject, tap, of, Observable } from 'rxjs';

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
        localStorage.setItem('user_name', res.user_display_name || res.user_nicename || credentials.username);
        localStorage.setItem('user_email', res.user_email || credentials.username);
        localStorage.setItem('user_id', String(res.user_id || ''));
        localStorage.setItem('user_nicename', res.user_nicename || '');
        localStorage.setItem('user_role', res.user_role || 'customer');
        this._isAuthenticated.next(true);
        
        if (res.token) {
          this.fetchUserRole(res.user_id);
        }
      })
    );
  }

  private fetchUserRole(userId: number | string) {
    this.http.get<any>(this.getBaseUrl(`/wp-json/wp/v2/users/${userId}`)).subscribe({
      next: (user) => {
        const role = user.roles?.[0] || 'customer';
        localStorage.setItem('user_role', role);
      },
      error: () => {}
    });
  }

  register(userData: { 
    username: string; 
    email: string; 
    password: string;
    first_name?: string;
    last_name?: string;
    billing?: any;
  }) {
    const formData = new URLSearchParams();
    formData.append('user_login', userData.email);
    formData.append('user_email', userData.email);
    formData.append('user_password', userData.password);
    formData.append('user_password2', userData.password);
    formData.append('first_name', userData.first_name || userData.username);
    formData.append('last_name', userData.last_name || '');
    formData.append('redirect_to', '');
    formData.append('wp-submit', 'Register');
    
    return this.http.post(
      this.getBaseUrl('/wp-login.php?action=register'),
      formData.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, responseType: 'text' }
    );
  }

  getCurrentUser() {
    const userId = localStorage.getItem('user_id');
    const userName = localStorage.getItem('user_name');
    const userEmail = localStorage.getItem('user_email');
    
    // Si tenemos datos básicos, retornamos un observable con esos datos
    if (userName) {
      return of({
        name: userName,
        email: userEmail || '',
        avatar_urls: {
          '96': `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=FF6B35&color=fff&size=96`
        },
        meta: {},
        roles: ['customer']
      });
    }
    
    return this.http.get(this.getBaseUrl('/wp-json/wp/v2/users/me'));
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_role');
    this._isAuthenticated.next(false);
  }

  isAdmin(): boolean {
    const role = localStorage.getItem('user_role');
    return role === 'administrator' || role === 'admin';
  }
}
