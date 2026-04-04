import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, catchError, throwError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WoocommerceService {
  private http = inject(HttpClient);
  private restBasePathDev = '/wp-json';

  private STORAGE_ACTIVE_SITE = 'wc_active_site_id';
  private STORAGE_SITE_KEY_PREFIX = 'wc_site_key_';
  private STORAGE_SITE_SECRET_PREFIX = 'wc_site_secret_';

  constructor() { }

  private getSites(): Array<{ id: string; name: string; url: string; usaIndexPhp?: boolean; authMode?: 'query' | 'header' }> {
    const envSites = (environment as any)?.woocommerceSites;
    if (Array.isArray(envSites) && envSites.length > 0) {
      return envSites.map((s: any) => {
        const mode = s?.authMode === 'header' ? 'header' : s?.authMode === 'query' ? 'query' : undefined;
        return { ...s, authMode: mode };
      });
    }
    return [
      {
        id: 'main',
        name: 'Principal',
        url: environment.woocommerce.url,
        usaIndexPhp: true,
      },
    ];
  }

  getActiveSite() {
    const sites = this.getSites();
    const defaultId = (environment as any)?.woocommerceDefaultSiteId || 'main';
    const storedId = typeof localStorage !== 'undefined' ? (localStorage.getItem(this.STORAGE_ACTIVE_SITE) || defaultId) : defaultId;
    return sites.find((s) => s.id === storedId) || sites[0];
  }

  setActiveSite(id: string) {
    try {
      localStorage.setItem(this.STORAGE_ACTIVE_SITE, id);
    } catch {
      return;
    }
  }

  getAllSites() {
    return this.getSites();
  }

  hasCredentialsFor(siteId: string): boolean {
    const site = this.getAllSites().find((s) => s.id === siteId);
    if (!site) return false;
    const { key, secret } = this.getSiteKeys(site);
    return Boolean(key && secret);
  }

  setSiteCredentials(siteId: string, consumerKey: string, consumerSecret: string) {
    try {
      localStorage.setItem(this.STORAGE_SITE_KEY_PREFIX + siteId, consumerKey);
      localStorage.setItem(this.STORAGE_SITE_SECRET_PREFIX + siteId, consumerSecret);
    } catch {
      return;
    }
  }

  private getSiteKeys(site: { id: string; url: string }) {
    const mainUrl = environment.woocommerce.url;
    const defaultId = (environment as any)?.woocommerceDefaultSiteId || 'main';
    
    // Check if credentials are in environment config
    const envSites = (environment as any)?.woocommerceSites || [];
    const envSite = envSites.find((s: any) => s.id === site.id);
    if (envSite?.consumerKey && envSite?.consumerSecret) {
      return {
        key: envSite.consumerKey,
        secret: envSite.consumerSecret,
      };
    }
    
    if (site.id === defaultId || site.url === mainUrl) {
      return {
        key: environment.woocommerce.consumerKey,
        secret: environment.woocommerce.consumerSecret,
      };
    }
    try {
      const key = localStorage.getItem(this.STORAGE_SITE_KEY_PREFIX + site.id) || '';
      const secret = localStorage.getItem(this.STORAGE_SITE_SECRET_PREFIX + site.id) || '';
      return { key, secret };
    } catch {
      return { key: '', secret: '' };
    }
  }

  private buildApiUrl(path: string, overrideMode?: 'query' | 'header'): { url: string; params: HttpParams; headers: HttpHeaders } {
    const site = this.getActiveSite();
    const { key, secret } = this.getSiteKeys(site);
    let fullUrl = '';
    
    // Siempre usamos URL directa para evitar problemas de proxy
    const restBase = site.usaIndexPhp ? '/index.php/wp-json' : '/wp-json';
    fullUrl = `${site.url}${restBase}${path}`;

    console.log('=== buildApiUrl Debug ===');
    console.log('site.id:', site.id);
    console.log('site.url:', site.url);
    console.log('path:', path);
    console.log('fullUrl:', fullUrl);
    console.log('key:', key ? key.substring(0, 10) + '...' : 'EMPTY');
    console.log('=========================');

    let params = new HttpParams();
    let headers = new HttpHeaders();
    const authMode = overrideMode || site.authMode || 'query';
    if (authMode === 'header') {
      const token = typeof btoa === 'function' ? btoa(`${key}:${secret}`) : '';
      headers = headers.set('Authorization', `Basic ${token}`);
    } else {
      params = params.set('consumer_key', key).set('consumer_secret', secret);
    }
    return { url: fullUrl, params, headers };
  }

  getProducts(page: number = 1, perPage: number = 10, search?: string, categoryId?: number): Observable<any[]> {
    const { url, params: baseParams, headers } = this.buildApiUrl('/wc/v3/products');
    let params = baseParams.set('page', page.toString()).set('per_page', perPage.toString());

    const normalizedSearch = search?.trim();
    if (normalizedSearch) {
      params = params.set('search', normalizedSearch);
    }

    if (typeof categoryId === 'number' && Number.isFinite(categoryId)) {
      params = params.set('category', String(categoryId));
    }

    // Debug: mostrar URL completa
    const fullDebugUrl = url + '?' + params.toString();
    console.log('=== WooCommerce Products URL ===');
    console.log(fullDebugUrl);
    console.log('================================');

    return this.http.get<any[]>(url, { params, headers }).pipe(
      catchError((err) => {
        console.error('=== WooCommerce API Error ===');
        console.error('Status:', err?.status);
        console.error('Message:', err?.message);
        console.error('URL:', url);
        console.error('================================');

        const isAuthError = err?.status === 401 || err?.status === 403;
        const fallback = this.buildApiUrl('/wc/v3/products', 'query');
        
        if (isAuthError || err?.status === 0) {
          console.log('Trying fallback...');
          let params2 = fallback.params.set('page', page.toString()).set('per_page', perPage.toString());
          if (search?.trim()) params2 = params2.set('search', search.trim());
          if (typeof categoryId === 'number' && Number.isFinite(categoryId)) params2 = params2.set('category', String(categoryId));
          return this.http.get<any[]>(fallback.url, { params: params2, headers: fallback.headers });
        }
        return throwError(() => err);
      })
    );
  }

  getCategories(perPage: number = 100): Observable<any[]> {
    const { url, params: baseParams, headers } = this.buildApiUrl('/wc/v3/products/categories');
    const params = baseParams.set('per_page', String(perPage)).set('hide_empty', 'true');

    return this.http.get<any[]>(url, { params, headers }).pipe(
      catchError((err) => {
        const is401 = err?.status === 401;
        const fallback = this.buildApiUrl('/wc/v3/products/categories', 'query');
        if (is401) {
          const params2 = fallback.params.set('per_page', String(perPage)).set('hide_empty', 'true');
          return this.http.get<any[]>(fallback.url, { params: params2, headers: fallback.headers });
        }
        return throwError(() => err);
      })
    );
  }

  getCategoriesByIds(ids: number[]): Observable<any[]> {
    // Prefer header-based auth first for main site, then fallback to query-based
    const safeIds = (Array.isArray(ids) ? ids : []).filter((i) => Number.isFinite(i));
    if (safeIds.length === 0) return of([]);
    // Try header/auth first
    const { url, params, headers } = this.buildApiUrl('/wc/v3/products/categories', undefined);
    const withInclude = params.set('include', safeIds.join(','));
    return this.http.get<any[]>(url, { params: withInclude, headers }).pipe(
      catchError(() => {
        // Fallback to query mode if header failed (401/403)
        const fallback = this.buildApiUrl('/wc/v3/products/categories', 'query');
        const p = fallback.params.set('include', safeIds.join(','));
        return this.http.get<any[]>(fallback.url, { params: p, headers: fallback.headers }).pipe(
          catchError(() => of([]))
        );
      })
    );
  }

  getAllCategories(perPage: number = 100): Observable<any[]> {
    const { url, params, headers } = this.buildApiUrl('/wc/v3/products/categories', undefined);
    const p = params.set('per_page', String(perPage));
    return this.http.get<any[]>(url, { params: p, headers }).pipe(
      catchError(() => {
        const fallback = this.buildApiUrl('/wc/v3/products/categories', 'query');
        const p2 = fallback.params.set('per_page', String(perPage));
        return this.http.get<any[]>(fallback.url, { params: p2, headers: fallback.headers }).pipe(
          catchError(() => of([]))
        );
      })
    );
  }

  // Endpoint de flexi-categories para obtener categorías con subcategorías
  getFlexiCategories(): Observable<any[]> {
    const { url, params, headers } = this.buildApiUrl('/flexi-categories/v1/all', 'query');
    return this.http.get<any[]>(url, { params, headers }).pipe(
      catchError(() => of([]))
    );
  }

  getProductById(id: number): Observable<any> {
    const { url, params, headers } = this.buildApiUrl(`/wc/v3/products/${id}?attributes=true&meta_data=true&categories=true`);

    return this.http.get<any>(url, { params, headers }).pipe(
      catchError((err) => {
        const is401 = err?.status === 401;
        const fallback = this.buildApiUrl(`/wc/v3/products/${id}?attributes=true&meta_data=true&categories=true`, 'query');
        if (is401) {
          return this.http.get<any>(fallback.url, { params: fallback.params, headers: fallback.headers });
        }
        return throwError(() => err);
      })
    );
  }

  getProductsByIds(ids: number[]): Observable<any[]> {
    const safeIds = (Array.isArray(ids) ? ids : [])
      .map((i) => Number(i))
      .filter((i) => Number.isFinite(i) && i > 0);

    const { url, params: baseParams, headers } = this.buildApiUrl('/wc/v3/products');
    let params = baseParams.set('per_page', String(Math.min(100, Math.max(1, safeIds.length))));

    if (safeIds.length > 0) {
      params = params.set('include', safeIds.join(','));
    }

    return this.http.get<any[]>(url, { params, headers }).pipe(
      catchError((err) => {
        const is401 = err?.status === 401;
        const fallback = this.buildApiUrl('/wc/v3/products', 'query');
        if (is401) {
          let params2 = fallback.params.set('per_page', String(Math.min(100, Math.max(1, safeIds.length))));
          if (safeIds.length > 0) params2 = params2.set('include', safeIds.join(','));
          return this.http.get<any[]>(fallback.url, { params: params2, headers: fallback.headers });
        }
        return throwError(() => err);
      })
    );
  }

  createOrder(payload: any): Observable<any> {
    const { url, params, headers } = this.buildApiUrl('/wc/v3/orders');

    return this.http.post<any>(url, payload, { params, headers });
  }

  getOrderById(id: number): Observable<any> {
    const safeId = Number(id);
    const { url, params, headers } = this.buildApiUrl(`/wc/v3/orders/${safeId}`);

    return this.http.get<any>(url, { params, headers });
  }

  getOrdersByCustomer(customerId: number, perPage: number = 100): Observable<any[]> {
    const { url, params: baseParams, headers } = this.buildApiUrl('/wc/v3/orders');
    const params = baseParams
      .set('customer', String(customerId))
      .set('per_page', String(perPage))
      .set('orderby', 'date')
      .set('order', 'desc');

    return this.http.get<any[]>(url, { params, headers });
  }
}
