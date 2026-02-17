import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WoocommerceService {
  private http = inject(HttpClient);
  private apiUrl = environment.woocommerce.url;
  private consumerKey = environment.woocommerce.consumerKey;
  private consumerSecret = environment.woocommerce.consumerSecret;

  constructor() { }

  getProducts(page: number = 1, perPage: number = 10): Observable<any[]> {
    const params = new HttpParams()
      .set('consumer_key', this.consumerKey)
      .set('consumer_secret', this.consumerSecret)
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    return this.http.get<any[]>(`${this.apiUrl}/wp-json/wc/v3/products`, { params });
  }

  // Ejemplo de autenticación JWT si se requiere login de usuario
  // login(username: string, password: string) { ... }
}
