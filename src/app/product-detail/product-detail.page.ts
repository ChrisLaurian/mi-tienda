import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cartOutline } from 'ionicons/icons';
import { WoocommerceService } from '../services/woocommerce.service';
import { CartService } from '../services/cart.service';
import { AlertController } from '@ionic/angular';
import { ThemeService } from '../services/theme.service';
import { environment } from '../../environments/environment';

interface TopicOption { id: string; label: string; price?: number }
interface TopicGroup { key: string; label: string; type: 'checkbox' | 'radio'; options: TopicOption[]; required?: boolean }

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.page.html',
  styleUrls: ['./product-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonContent,
    IonIcon,
    IonSpinner,
  ],
})
export class ProductDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private woocommerceService = inject(WoocommerceService);
  private cartService = inject(CartService);
  private alertCtrl = inject(AlertController);
  private themeService = inject(ThemeService);

  isLoading = true;
  product: any | null = null;
  enrichedCategories: any[] = [];
  selectedCategoryOptions: Record<string, Record<string, Set<string>>> = {};
  cartCount$ = this.cartService.totalQuantity$;
  topicsToRender: TopicGroup[] = [];
  selectedByTopic: Record<string, Set<string>> = {};
  quantity = 1;
  isFavorite = false;
  isAdded = false;

  constructor() {
    addIcons({ cartOutline });
  }

  isOptionSelected(categoryId: number, optionGroup: string, optionName: string): boolean {
    const key = String(categoryId);
    if (this.selectedCategoryOptions[key] && this.selectedCategoryOptions[key][optionGroup]) {
      return this.selectedCategoryOptions[key][optionGroup].has(optionName);
    }
    return false;
  }

  toggleCategoryOption(categoryId: number, optionGroup: string, optionName: string, optionType: string) {
    const key = String(categoryId);
    if (!this.selectedCategoryOptions[key]) {
      this.selectedCategoryOptions[key] = {};
    }
    if (!this.selectedCategoryOptions[key][optionGroup]) {
      this.selectedCategoryOptions[key][optionGroup] = new Set<string>();
    }
    
    if (optionType === 'radio') {
      this.selectedCategoryOptions[key][optionGroup] = new Set<string>([optionName]);
    } else {
      if (this.selectedCategoryOptions[key][optionGroup].has(optionName)) {
        this.selectedCategoryOptions[key][optionGroup].delete(optionName);
      } else {
        this.selectedCategoryOptions[key][optionGroup].add(optionName);
      }
    }
  }

  private loadCategoriesInterior(categories: any[], productId: number) {
    if (!categories || categories.length === 0) {
      this.enrichedCategories = [];
      return;
    }
    
    this.enrichedCategories = categories.map(c => ({ ...c, data: [] }));
    
    this.woocommerceService.getProductCategoriesWithData(productId).subscribe({
      next: (flexiData: any) => {
        if (flexiData && Array.isArray(flexiData) && flexiData.length > 0) {
          const enriched = this.enrichedCategories.map(cat => {
            return { ...cat, data: flexiData };
          });
          this.enrichedCategories = enriched;
        } else {
          const devData = this.getDevCategoriesData(productId);
          if (devData && devData.length > 0) {
            const enriched = this.enrichedCategories.map(cat => {
              return { ...cat, data: devData };
            });
            this.enrichedCategories = enriched;
          }
        }
      },
      error: () => {
        const devData = this.getDevCategoriesData(productId);
        if (devData && devData.length > 0) {
          const enriched = this.enrichedCategories.map(cat => {
            return { ...cat, data: devData };
          });
          this.enrichedCategories = enriched;
        }
      }
    });
  }
  
  private getDevCategoriesData(productId: number): any[] {
    // Datos de ejemplo basados en lo que mostraste
    return [
      {
        titulo: 'Frutas',
        required: 'no',
        tipo: 'checkbox',
        layout: 'vertical',
        items: [
          { nombre: 'Fresa', precio: 0, stock: 'yes' },
          { nombre: 'Durazno', precio: 0, stock: 'yes' },
          { nombre: 'Platano', precio: 0, stock: 'yes' }
        ]
      },
      {
        titulo: 'Tamaño',
        required: 'yes',
        tipo: 'radio',
        layout: 'vertical',
        items: [
          { nombre: 'Ch', precio: 0, stock: 'yes' },
          { nombre: 'M', precio: 0, stock: 'yes' },
          { nombre: 'G', precio: 0, stock: 'yes' }
        ]
      }
    ];
  }

  private mockCategories(ids: number[]): any[] {
    return ids.map((id) => ({ id, name: `Categoría ${id}`, slug: `categoria-${id}`, description: 'Datos simulados', count: Math.floor(Math.random() * 100) }));
  }

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;

    if (!Number.isFinite(id)) {
      this.isLoading = false;
      return;
    }

    this.woocommerceService.getProductById(id).subscribe({
      next: (data) => {
        this.product = data;
        this.loadTopics();
        this.loadCategoriesInterior(data?.categories || [], id);
        this.isLoading = false;
      },
      error: () => {
        this.product = null;
        this.isLoading = false;
      },
    });
  }

  addToCart() {
    if (!this.product) return;
    const missing = this.getMissingRequiredTopicLabels();
    if (missing.length > 0) {
      this.alertCtrl
        .create({
          header: 'Selecciona opciones requeridas',
          message: `Faltan: ${missing.join(', ')}`,
          buttons: ['OK'],
        })
        .then((a) => a.present());
      return;
    }
    const topicsPayload = this.topicsToRender
      .map((t) => {
        const selected = this.selectedByTopic[t.key] || new Set<string>();
        const opts = (t.options || []).filter((o) => selected.has(o.id)).map((o) => ({ label: o.label, price: o.price || 0 }));
        if (opts.length === 0) return null;
        return { label: t.label, type: t.type, options: opts };
      })
      .filter(Boolean) as Array<{ label: string; type?: 'checkbox' | 'radio'; options: Array<{ label: string; price?: number }> }>;
    const extra = this.selectedExtraTotal();
    this.cartService.addProduct(this.product, this.quantity, { topics: topicsPayload, extraTotal: extra });
    this.isAdded = true;
    setTimeout(() => this.isAdded = false, 2000);
    this.selectedByTopic = {};
    this.topicsToRender.forEach((t) => (this.selectedByTopic[t.key] = new Set<string>()));
  }

  private loadTopics() {
    const groups: TopicGroup[] = [];
    
    const fromMeta = this.extractFromMetaData();
    groups.push(...fromMeta);
    
    const fromAttrs = this.extractFromAttributes();
    groups.push(...fromAttrs);
    
    if (groups.length === 0) {
      const cats = Array.isArray(this.product?.categories) ? this.product.categories : [];
      const fallback = this.buildFallbackFromEnv(cats);
      groups.push(...fallback);
    }
    
    this.applyTopics(groups);
  }

  private extractFromMetaData(): TopicGroup[] {
    if (!this.product || !Array.isArray(this.product.meta_data)) return [];
    
    const groups: TopicGroup[] = [];
    
    this.product.meta_data.forEach((meta: any) => {
      if (!meta?.key || !meta?.value) return;
      
      const key = String(meta.key);
      if (key.startsWith('_')) return;
      
      try {
        let value = meta.value;
        if (typeof value === 'string') {
          value = JSON.parse(value);
        }
        
        if (Array.isArray(value)) {
          value.forEach((g: any) => {
            const label = g?.label ?? g?.name ?? g?.title ?? g?.titulo ?? '';
            const keyRaw = g?.key ?? g?.id ?? label;
            const groupKey = String(keyRaw || '').trim().toLowerCase().replace(/\s+/g, '_');
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
            }).filter((o: TopicOption) => o.label);
            
            if (groupKey && label && options.length > 0) {
              groups.push({ key: groupKey, label: String(label), type, options, required });
            }
          });
        } else if (typeof value === 'object' && (value as any)?.groups) {
          // Support legacy mgp_data payload wrapped as { groups: [...] }
          const groupsArr = (value as any).groups;
          if (Array.isArray(groupsArr)) {
            groupsArr.forEach((g: any) => {
              const label = g?.label ?? g?.name ?? g?.title ?? g?.titulo ?? '';
              const keyRaw = g?.key ?? g?.id ?? label;
              const groupKey = String(keyRaw || '').trim().toLowerCase().replace(/\s+/g, '_');
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
              }).filter((o: any) => o.label);

              if (groupKey && label && options.length > 0) {
                groups.push({ key: groupKey, label: String(label), type, options, required });
              }
            });
          }
        }
        else if (typeof value === 'object') {
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

  private extractFromAttributes(): TopicGroup[] {
    if (!this.product || !Array.isArray(this.product.attributes)) return [];
    
    const groups: TopicGroup[] = [];
    
    this.product.attributes.forEach((attr: any) => {
      if (!attr?.name || !Array.isArray(attr?.options)) return;
      
      const label = attr.name;
      const key = String(label).trim().toLowerCase().replace(/\s+/g, '_');
      const isVariation = attr?.variation === true || attr?.visible === false;
      
      if (isVariation) return;
      
      const options = attr.options.map((opt: any, idx: number) => {
        const optLabel = String(opt?.label ?? opt?.name ?? opt ?? `Option ${idx + 1}`).trim();
        const optId = String(opt?.slug ?? opt?.label ?? opt ?? optLabel).trim().toLowerCase().replace(/\s+/g, '_');
        return { id: optId, label: optLabel, price: 0 };
      }).filter((o: TopicOption) => o.label);
      
      if (options.length > 0) {
        groups.push({ key, label, type: 'checkbox', options, required: false });
      }
    });
    
    return groups;
  }

  private buildFallbackFromEnv(cats: any[]): TopicGroup[] {
    const topicsCfg = (environment as any)?.woocommerce?.pluginTopics || {};
    const catNames = (Array.isArray(cats) ? cats : []).reduce<string[]>((acc, c: any) => {
      const slug = (c?.slug || '').toString().toLowerCase();
      const name = (c?.name || '').toString().toLowerCase();
      if (slug) acc.push(slug);
      if (name) acc.push(name);
      return acc;
    }, []);
    const result: TopicGroup[] = [];
    Object.keys(topicsCfg).forEach((key) => {
      const t = topicsCfg[key];
      const names = (t?.categoryNames || []).map((s: string) => s.toLowerCase());
      const matches = names.some((n: string) => catNames.includes(n));
      if ((matches || catNames.length === 0) && Array.isArray(t?.options) && t.options.length > 0) {
        result.push({
          key,
          label: t?.label || key,
          type: (t?.type === 'radio' ? 'radio' : 'checkbox'),
          options: Array.isArray(t?.options) ? t.options : [],
        });
      }
    });
    return result;
  }

  private applyTopics(groups: TopicGroup[]) {
    this.topicsToRender = groups;
    this.selectedByTopic = {};
    groups.forEach((t) => {
      this.selectedByTopic[t.key] = new Set<string>();
      if (t.type === 'radio' && t.required && t.options?.length > 0) {
        this.selectedByTopic[t.key].add(t.options[0].id);
      }
    });
  }

  toggleOption(topicKey: string, id: string, checked: boolean) {
    if (!this.selectedByTopic[topicKey]) this.selectedByTopic[topicKey] = new Set<string>();
    if (checked) {
      if (this.topicsToRender.find((t) => t.key === topicKey)?.type === 'radio') {
        this.selectedByTopic[topicKey] = new Set<string>([id]);
      } else {
        this.selectedByTopic[topicKey].add(id);
      }
    } else {
      this.selectedByTopic[topicKey].delete(id);
    }
  }

  getBasePriceNumber(): number {
    const raw = this.product?.price;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }

  selectedExtraTotal(): number {
    let sum = 0;
    for (const t of this.topicsToRender) {
      const selected = this.selectedByTopic[t.key] || new Set<string>();
      for (const opt of t.options || []) {
        if (selected.has(opt.id)) {
          const p = Number(opt.price) || 0;
          sum += p;
        }
      }
    }
    return sum;
  }

  private getMissingRequiredTopicLabels(): string[] {
    const missing: string[] = [];
    for (const t of this.topicsToRender) {
      if (!t.required) continue;
      const selected = this.selectedByTopic[t.key];
      const count = selected ? selected.size : 0;
      if (count === 0) {
        missing.push(t.label);
      }
    }
    return missing;
  }

  toggleTheme() {
    this.themeService.toggle();
  }

  goBack() {
    this.router.navigate(['/store']);
  }

  increaseQuantity() {
    this.quantity++;
  }

  decreaseQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }

  getProductRating(): string {
    // Return a default rating or from product data if available
    return this.product?.average_rating || '5.0';
  }
}
