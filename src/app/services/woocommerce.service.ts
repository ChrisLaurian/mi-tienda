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

  getProducts(page: number = 1, perPage: number = 10, search?: string, categoryId?: number): Observable<any[]> {
    let params = new HttpParams()
      .set('consumer_key', this.consumerKey)
      .set('consumer_secret', this.consumerSecret)
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    const normalizedSearch = search?.trim();
    if (normalizedSearch) {
      params = params.set('search', normalizedSearch);
    }

    if (typeof categoryId === 'number' && Number.isFinite(categoryId)) {
      params = params.set('category', String(categoryId));
    }

    const url = environment.production
      ? `${this.apiUrl}${this.restBasePathProd}/wc/v3/products`
      : `${this.restBasePathDev}/wc/v3/products`;

    return this.http.get<any[]>(url, { 
      params 
    });
  }

  getCategories(perPage: number = 100): Observable<any[]> {
    const params = new HttpParams()
      .set('consumer_key', this.consumerKey)
      .set('consumer_secret', this.consumerSecret)
      .set('per_page', String(perPage))
      .set('hide_empty', 'true');

    const url = environment.production
      ? `${this.apiUrl}${this.restBasePathProd}/wc/v3/products/categories`
      : `${this.restBasePathDev}/wc/v3/products/categories`;

    return this.http.get<any[]>(url, {
      params,
    });
  }

  getProductById(id: number): Observable<any> {
    const params = new HttpParams()
      .set('consumer_key', this.consumerKey)
      .set('consumer_secret', this.consumerSecret);

    const url = environment.production
      ? `${this.apiUrl}${this.restBasePathProd}/wc/v3/products/${id}`
      : `${this.restBasePathDev}/wc/v3/products/${id}`;

    return this.http.get<any>(url, {
      params
    });
  }

  getProductsByIds(ids: number[]): Observable<any[]> {
    const safeIds = (Array.isArray(ids) ? ids : [])
      .map((i) => Number(i))
      .filter((i) => Number.isFinite(i) && i > 0);

    let params = new HttpParams()
      .set('consumer_key', this.consumerKey)
      .set('consumer_secret', this.consumerSecret)
      .set('per_page', String(Math.min(100, Math.max(1, safeIds.length))));

    if (safeIds.length > 0) {
      params = params.set('include', safeIds.join(','));
    }

    const url = environment.production
      ? `${this.apiUrl}${this.restBasePathProd}/wc/v3/products`
      : `${this.restBasePathDev}/wc/v3/products`;

    return this.http.get<any[]>(url, {
      params,
    });
  }

  createOrder(payload: any): Observable<any> {
    const params = new HttpParams()
      .set('consumer_key', this.consumerKey)
      .set('consumer_secret', this.consumerSecret);

    const url = environment.production
      ? `${this.apiUrl}${this.restBasePathProd}/wc/v3/orders`
      : `${this.restBasePathDev}/wc/v3/orders`;

    return this.http.post<any>(url, payload, {
      params,
    });
  }

  getOrderById(id: number): Observable<any> {
    const safeId = Number(id);
    const params = new HttpParams()
      .set('consumer_key', this.consumerKey)
      .set('consumer_secret', this.consumerSecret);

    const url = environment.production
      ? `${this.apiUrl}${this.restBasePathProd}/wc/v3/orders/${safeId}`
      : `${this.restBasePathDev}/wc/v3/orders/${safeId}`;

    return this.http.get<any>(url, {
      params,
    });
  }
}
