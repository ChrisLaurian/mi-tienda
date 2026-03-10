import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WoocommerceService {
  private http = inject(HttpClient);
  private apiUrl = environment.production ? environment.woocommerce.url : '';
  private restBasePathDev = '/wp-json';
  private restBasePathProd = '/index.php/wp-json';
  private consumerKey = environment.woocommerce.consumerKey;
  private consumerSecret = environment.woocommerce.consumerSecret;

  constructor() { }

  getProducts(page: number = 1, perPage: number = 10): Observable<any[]> {
    const params = new HttpParams()
      .set('consumer_key', this.consumerKey)
      .set('consumer_secret', this.consumerSecret)
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    const url = environment.production
      ? `${this.apiUrl}${this.restBasePathProd}/wc/v3/products`
      : `${this.restBasePathDev}/wc/v3/products`;

    return this.http.get<any[]>(url, { 
      params 
    });
  }
}
