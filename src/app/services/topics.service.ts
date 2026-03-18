import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';

export interface TopicOption { id: string; label: string; price?: number }
export interface TopicGroup { key: string; label: string; type: 'checkbox' | 'radio'; options: TopicOption[]; required?: boolean }

@Injectable({ providedIn: 'root' })
export class TopicsService {
  private http = inject(HttpClient);

  private buildBaseUrl(): string {
    const sites = (environment as any)?.woocommerce?.sites || [];
    const main = sites.find((s: any) => s?.id === 'main') || { url: environment.woocommerce.url, usaIndexPhp: true };
    const isLocalhost = typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost';
    if (!environment.production) {
      if (isLocalhost) return `/proxy-wc/main`;
      return `/proxy-wc/main`;
    }
    const restBase = main.usaIndexPhp ? '/index.php/wp-json' : '/wp-json';
    return `${main.url}${restBase}`;
  }

  private buildTopicsUrlForCategory(categoryId: number): string {
    const ns = (environment as any)?.woocommerce?.pluginApi?.namespace || 'custom-plugin/v1';
    const pattern = (environment as any)?.woocommerce?.pluginApi?.categoryTopicsPath || '/{namespace}/categories/{id}/topics';
    const path = pattern.replace('{namespace}', ns).replace('{id}', String(categoryId));
    return `${this.buildBaseUrl()}${path}`;
  }

  private buildTopicsUrlForProduct(productId: number): string {
    const ns = (environment as any)?.woocommerce?.pluginApi?.namespace || 'custom-plugin/v1';
    const pattern = (environment as any)?.woocommerce?.pluginApi?.productTopicsPath || '/{namespace}/topics/{id}';
    const path = pattern.replace('{namespace}', ns).replace('{id}', String(productId));
    return `${this.buildBaseUrl()}${path}`;
  }

  private parseGroups(data: any): TopicGroup[] {
    if (!data) return [];
    if (Array.isArray(data)) {
      return data
        .map((g: any) => {
          const label =
            g?.label ??
            g?.name ??
            g?.title ??
            g?.titulo ??
            '';
          const keyRaw =
            g?.key ??
            g?.id ??
            label;
          const key = String(keyRaw || '').trim().toLowerCase().replace(/\s+/g, '_');
          const typeRaw = g?.type ?? g?.tipo;
          const type = (String(typeRaw || '').toLowerCase() === 'radio' ? 'radio' : 'checkbox') as 'checkbox' | 'radio';
          const requiredRaw = g?.required;
          const required = typeof requiredRaw === 'string'
            ? requiredRaw.toLowerCase() === 'yes'
            : Boolean(requiredRaw);

          // Admite "options" o "items" con { label|name|titulo|nombre }
          const optionsSrc = Array.isArray(g?.options) ? g.options : (Array.isArray(g?.items) ? g.items : []);
          const options = optionsSrc.map((o: any) => {
            const optLabel = String(o?.label ?? o?.name ?? o?.titulo ?? o?.nombre ?? '').trim();
            const optIdRaw = o?.id ?? o?.value ?? optLabel;
            const optId = String(optIdRaw || '').trim().toLowerCase().replace(/\s+/g, '_');
            const priceRaw = o?.precio ?? o?.price ?? 0;
            const priceNum = Number(priceRaw) || 0;
            return { id: optId, label: optLabel, price: priceNum };
          });

          return {
            key,
            label: String(label || ''),
            type,
            options,
            required
          };
        })
        .filter((g: TopicGroup) => g.key && g.label);
    }
    if (Array.isArray(data?.groups)) return this.parseGroups(data.groups);
    return [];
  }

  private fallbackFromConfig(categoryNames: string[]): TopicGroup[] {
    // Para cumplir "solo trae los que existen", no inventamos topics si el endpoint no responde
    return [];
    }

  getTopicsForCategory(categoryId: number, categoryNames: string[]): Observable<TopicGroup[]> {
    const url = this.buildTopicsUrlForCategory(categoryId);
    const params = new HttpParams();
    const headers = new HttpHeaders();
    return this.http.get<any>(url, { params, headers }).pipe(
      map((res) => this.parseGroups(res)),
      catchError(() => of([])),
      map((groups) => (groups.length > 0 ? groups : this.fallbackFromConfig(categoryNames)))
    );
  }

  getTopicsForCategories(categories: Array<{ id: number; name?: string; slug?: string }>): Observable<TopicGroup[]> {
    const ids = categories.map((c) => Number(c?.id)).filter((n) => Number.isFinite(n));
    const names = categories.reduce<string[]>((acc, c) => {
      const n = (c?.name || '').toString().toLowerCase();
      const s = (c?.slug || '').toString().toLowerCase();
      if (n) acc.push(n);
      if (s) acc.push(s);
      return acc;
    }, []).filter(Boolean);
    if (ids.length === 0) return of(this.fallbackFromConfig(names));
    const calls = ids.map((id) => this.getTopicsForCategory(id, names));
    return forkJoin(calls).pipe(
      map((arrays: TopicGroup[][]) => {
        const merged: TopicGroup[] = [];
        arrays.forEach((arr) => merged.push(...arr));
        return merged;
      }),
      map((groups) => {
        const mapByKey = new Map<string, TopicGroup>();
        groups.forEach((g: TopicGroup) => {
          if (!g?.key) return;
          if (!mapByKey.has(g.key)) {
            mapByKey.set(g.key, { ...g, options: [...g.options] });
          } else {
            const existing = mapByKey.get(g.key)!;
            const seen = new Set(existing.options.map((o) => o.id));
            g.options.forEach((o: TopicOption) => {
              if (!seen.has(o.id)) existing.options.push(o);
            });
          }
        });
        return Array.from(mapByKey.values());
      })
    );
  }

  getTopicsForProduct(productId: number): Observable<TopicGroup[]> {
    const url = this.buildTopicsUrlForProduct(productId);
    const params = new HttpParams();
    const headers = new HttpHeaders();
    return this.http.get<any>(url, { params, headers }).pipe(
      map((res) => this.parseGroups(res)),
      catchError(() => of([]))
    );
  }
}
