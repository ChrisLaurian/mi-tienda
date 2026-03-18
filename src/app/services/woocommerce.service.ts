import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, catchError, throwError } from 'rxjs';

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
    const envSites = environment?.woocommerce?.sites as Array<{ id: string; name: string; url: string; usaIndexPhp?: boolean; authMode?: 'query' | 'header' }>;
    if (Array.isArray(envSites) && envSites.length > 0) {
      return envSites.map((s) => {
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
    const defaultId = environment?.woocommerce?.defaultSiteId || 'main';
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
    const defaultId = environment?.woocommerce?.defaultSiteId || 'main';
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
    const isLocalhost = typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost';
    // Si estamos en localhost (cualquier puerto), forzamos proxy para evitar CORS
    if (isLocalhost) {
      fullUrl = `/proxy-wc/${site.id}${path}`;
    } else if (!environment.production) {
      // Desarrollo sin localhost (por si se usa LAN/IP), también intentamos proxy
      fullUrl = `/proxy-wc/${site.id}${path}`;
    } else {
      // Producción: llamada directa al dominio
      const restBase = site.usaIndexPhp ? '/index.php/wp-json' : '/wp-json';
      fullUrl = `${site.url}${restBase}${path}`;
    }

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

    return this.http.get<any[]>(url, { params, headers }).pipe(
      catchError((err) => {
        const is401 = err?.status === 401;
        const fallback = this.buildApiUrl('/wc/v3/products', 'query');
        if (is401) {
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

  getProductById(id: number): Observable<any> {
    const { url, params, headers } = this.buildApiUrl(`/wc/v3/products/${id}`);

    return this.http.get<any>(url, { params, headers }).pipe(
      catchError((err) => {
        const is401 = err?.status === 401;
        const fallback = this.buildApiUrl(`/wc/v3/products/${id}`, 'query');
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
}
