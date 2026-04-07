import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, catchError, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Promotion {
  id?: number;
  title: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  start_date: string;
  end_date: string;
  active: boolean;
  product_ids: number[];
  category_ids: number[];
  code?: string;
  usage_limit?: number;
  used_count?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PromotionsService {
  private http = inject(HttpClient);

  private getSite() {
    const sites = (environment as any)?.woocommerceSites || [];
    const defaultId = (environment as any)?.woocommerceDefaultSiteId || 'main';
    const storedId = typeof localStorage !== 'undefined' ? (localStorage.getItem('wc_active_site_id') || defaultId) : defaultId;
    return sites.find((s: any) => s.id === storedId) || sites[0];
  }

  private buildApiUrl(path: string): { url: string; params: HttpParams; headers: HttpHeaders } {
    const site = this.getSite();
    const restBase = site.usaIndexPhp ? '/index.php/wp-json' : '/wp-json';
    const fullUrl = `${site.url}${restBase}${path}`;

    let params = new HttpParams();
    let headers = new HttpHeaders();
    
    return { url: fullUrl, params, headers };
  }

  getPromotions(): Observable<Promotion[]> {
    const localPromos = this.getLocalPromotions();
    const { url, params, headers } = this.buildApiUrl('/wp/v2/promotions');
    
    return this.http.get<any[]>(url, { params, headers }).pipe(
      map(apiPromos => [...localPromos, ...(apiPromos || [])]),
      catchError(() => of(localPromos))
    );
  }

  getPromotion(id: number): Observable<Promotion | null> {
    const localPromos = this.getLocalPromotions();
    const localPromo = localPromos.find(p => p.id === id);
    if (localPromo) {
      return of(localPromo);
    }

    const { url, params, headers } = this.buildApiUrl(`/wp/v2/promotions/${id}`);
    
    return this.http.get<any>(url, { params, headers }).pipe(
      catchError(() => of(null))
    );
  }

  createPromotion(promotion: Promotion): Observable<Promotion> {
    const { url, params, headers } = this.buildApiUrl('/wp/v2/promotions');
    
    return this.http.post<any>(url, promotion, { params, headers }).pipe(
      catchError(() => of(null as any))
    );
  }

  updatePromotion(id: number, promotion: Promotion): Observable<Promotion> {
    const { url, params, headers } = this.buildApiUrl(`/wp/v2/promotions/${id}`);
    
    return this.http.put<any>(url, promotion, { params, headers }).pipe(
      catchError(() => of(null as any))
    );
  }

  deletePromotion(id: number): Observable<boolean> {
    const { url, params, headers } = this.buildApiUrl(`/wp/v2/promotions/${id}`);
    
    return this.http.delete(url, { params, headers }).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  getProducts(): Observable<any[]> {
    const { url, params, headers } = this.buildApiUrl('/wc/v3/products');
    const p = params.set('per_page', '100');
    
    return this.http.get<any[]>(url, { params: p, headers }).pipe(
      catchError(() => of([]))
    );
  }

  getCategories(): Observable<any[]> {
    const { url, params, headers } = this.buildApiUrl('/wc/v3/products/categories');
    const p = params.set('per_page', '100');
    
    return this.http.get<any[]>(url, { params: p, headers }).pipe(
      catchError(() => of([]))
    );
  }

  applyPromotion(code: string, cartTotal: number): Observable<{ valid: boolean; discount: number; message: string }> {
    return this.getPromotions().pipe(
      map(promotions => {
        const validPromotion = promotions.find(p => 
          p.active && 
          p.code?.toLowerCase() === code?.toLowerCase() &&
          new Date(p.start_date) <= new Date() &&
          new Date(p.end_date) >= new Date() &&
          (!p.usage_limit || (p.used_count || 0) < p.usage_limit)
        );

        if (!validPromotion) {
          return { valid: false, discount: 0, message: 'Código de promoción inválido o expirado' };
        }

        let discount = 0;
        if (validPromotion.discount_type === 'percentage') {
          discount = cartTotal * (validPromotion.discount_value / 100);
        } else {
          discount = validPromotion.discount_value;
        }

        return { 
          valid: true, 
          discount: Math.min(discount, cartTotal), 
          message: `Promoción aplicada: ${validPromotion.title}` 
        };
      }),
      catchError(() => of({ valid: false, discount: 0, message: 'Error al aplicar promoción' }))
    );
  }

  savePromotionLocal(promotion: Promotion, id: number | null): Observable<any> {
    let promotions = this.getLocalPromotions();
    
    if (id) {
      const index = promotions.findIndex(p => p.id === id);
      if (index > -1) {
        promotions[index] = { ...promotion, id };
      }
    } else {
      const newId = Math.max(0, ...promotions.map(p => p.id || 0)) + 1;
      promotions.push({ ...promotion, id: newId });
    }
    
    localStorage.setItem('local_promotions', JSON.stringify(promotions));
    return of(true);
  }

  private getLocalPromotions(): Promotion[] {
    try {
      return JSON.parse(localStorage.getItem('local_promotions') || '[]');
    } catch {
      return [];
    }
  }
}
