import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  IonBadge,
  IonBackButton,
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonItem,
  IonLabel,
  IonList,
  IonHeader,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { WoocommerceService } from '../services/woocommerce.service';
import { CartService } from '../services/cart.service';
import { environment } from '../../environments/environment';
import { TopicsService, TopicGroup } from '../services/topics.service';
import { AlertController } from '@ionic/angular';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.page.html',
  styleUrls: ['./product-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonBadge,
    IonContent,
    IonSpinner,
    IonList,
    IonItem,
    IonLabel,
    IonCheckbox,
  ],
})
export class ProductDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private woocommerceService = inject(WoocommerceService);
  private cartService = inject(CartService);
  private topicsService = inject(TopicsService);
  private alertCtrl = inject(AlertController);
  private themeService = inject(ThemeService);

  isLoading = true;
  product: any | null = null;
  cartCount$ = this.cartService.totalQuantity$;
  topicsToRender: TopicGroup[] = [];
  selectedByTopic: Record<string, Set<string>> = {};

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
    this.cartService.addProduct(this.product, 1, { topics: topicsPayload, extraTotal: extra });
    this.selectedByTopic = {};
    this.topicsToRender.forEach((t) => (this.selectedByTopic[t.key] = new Set<string>()));
  }

  private loadTopics() {
    const pid = Number(this.product?.id);
    if (Number.isFinite(pid) && pid > 0) {
      this.topicsService.getTopicsForProduct(pid).subscribe({
        next: (groups) => {
          if (!groups || groups.length === 0) {
            const cats = Array.isArray(this.product?.categories) ? this.product.categories : [];
            this.topicsService.getTopicsForCategories(cats).subscribe({
              next: (g2) => this.applyTopics(g2),
              error: () => this.applyTopics([]),
            });
            return;
          }
          this.applyTopics(groups);
        },
        error: () => {
          const cats = Array.isArray(this.product?.categories) ? this.product.categories : [];
          this.topicsService.getTopicsForCategories(cats).subscribe({
            next: (g2) => this.applyTopics(g2),
            error: () => this.applyTopics([]),
          });
        }
      });
      return;
    }
    const cats = Array.isArray(this.product?.categories) ? this.product.categories : [];
    this.topicsService.getTopicsForCategories(cats).subscribe({
      next: (groups) => {
        this.applyTopics(groups);
      },
      error: () => this.applyTopics([])
    });
  }

  private buildFallbackFromEnv(cats: any[]): TopicGroup[] {
    const topicsCfg = (environment as any)?.woocommerce?.pluginTopics || {};
    const catNames = cats.reduce<string[]>((acc, c: any) => {
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
      if (matches) {
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
}
