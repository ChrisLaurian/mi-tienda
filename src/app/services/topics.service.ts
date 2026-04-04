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
    const sites = (environment as any)?.woocommerceSites || [];
    const main = sites.find((s: any) => s?.id === 'main') || { url: environment.woocommerce.url, usaIndexPhp: true };
    const restBase = main.usaIndexPhp ? '/index.php/wp-json' : '/wp-json';
    return `${main.url}${restBase}`;
  }

  private buildTopicsUrlForCategory(categoryId: number): string {
    const ns = (environment as any)?.woocommerce?.pluginApi?.namespace || 'flexi-options/v1';
    const pattern = '/{namespace}/topics/{id}';
    const path = pattern.replace('{namespace}', ns).replace('{id}', String(categoryId));
    return `${this.buildBaseUrl()}${path}`;
  }

  private buildTopicsUrlForProduct(productId: number): string {
    const ns = (environment as any)?.woocommerce?.pluginApi?.namespace || 'flexi-options/v1';
    const pattern = '/{namespace}/topics/{id}';
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

  private extractFromAttributes(product: any): TopicGroup[] {
    if (!product || !Array.isArray(product.attributes)) return [];
    
    const groups: TopicGroup[] = [];
    
    product.attributes.forEach((attr: any) => {
      if (!attr?.name || !Array.isArray(attr?.options)) return;
      
      const label = attr.name;
      const key = String(label).trim().toLowerCase().replace(/\s+/g, '_');
      const isVariation = attr?.variation === true || attr?.visible === false;
      
      if (isVariation && !label.toLowerCase().includes('size') && !label.toLowerCase().includes('talla') && !label.toLowerCase().includes('tamano')) {
        return;
      }
      
      const options = attr.options.map((opt: any, idx: number) => {
        const optLabel = String(opt?.label ?? opt?.name ?? opt ?? `Option ${idx + 1}`).trim();
        const optId = String(opt?.slug ?? opt?.label ?? opt ?? optLabel).trim().toLowerCase().replace(/\s+/g, '_');
        return {
          id: optId,
          label: optLabel,
          price: 0
        };
      }).filter((o: TopicOption) => o.label);
      
      if (options.length > 0) {
        groups.push({
          key,
          label,
          type: 'checkbox',
          options,
          required: false
        });
      }
    });
    
    return groups;
  }

  private extractFromMetaData(product: any): TopicGroup[] {
    if (!product || !Array.isArray(product.meta_data)) return [];
    
    const groups: TopicGroup[] = [];
    
    product.meta_data.forEach((meta: any) => {
      if (!meta?.key || !meta?.value) return;
      
      const key = String(meta.key);
      if (key.startsWith('_')) return;
      
      try {
        let value = meta.value;
        if (typeof value === 'string') {
          value = JSON.parse(value);
        }
        
        if (Array.isArray(value)) {
          const parsed = this.parseGroups(value);
          if (parsed.length > 0) {
            groups.push(...parsed);
          }
        } else if (typeof value === 'object') {
          if (value.options || value.items) {
            const group: TopicGroup = {
              key: key.toLowerCase().replace(/\s+/g, '_'),
              label: value.label || key,
              type: (value.type === 'radio' ? 'radio' : 'checkbox') as 'checkbox' | 'radio',
              required: value.required || false,
              options: (value.options || value.items || []).map((o: any) => ({
                id: String(o.id || o.label || '').toLowerCase().replace(/\s+/g, '_'),
                label: String(o.label || o.id || ''),
                price: Number(o.price || 0)
              }))
            };
            groups.push(group);
          }
        }
      } catch {}
    });
    
    return groups;
  }

  getTopicsForProductWithData(product: any): Observable<TopicGroup[]> {
    return new Observable(observer => {
      const groups: TopicGroup[] = [];
      
      const fromMeta = this.extractFromMetaData(product);
      if (fromMeta.length > 0) groups.push(...fromMeta);
      
      const fromAttrs = this.extractFromAttributes(product);
      if (fromAttrs.length > 0) groups.push(...fromAttrs);
      
      observer.next(groups);
      observer.complete();
    });
  }

  getTopicsForCategory(categoryId: number): Observable<TopicGroup[]> {
    const url = this.buildTopicsUrlForCategory(categoryId);
    const params = new HttpParams();
    const headers = new HttpHeaders();
    return this.http.get<any>(url, { params, headers }).pipe(
      map((res) => this.parseGroups(res)),
      catchError(() => of([]))
    );
  }

  getTopicsForCategories(categories: Array<{ id: number; name?: string; slug?: string }>): Observable<TopicGroup[]> {
    const ids = categories.map((c) => Number(c?.id)).filter((n) => Number.isFinite(n));
    if (ids.length === 0) return of([]);
    
    const calls = ids.map((id) => this.getTopicsForCategory(id));
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
