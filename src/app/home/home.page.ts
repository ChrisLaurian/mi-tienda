import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonSelect,
  IonSelectOption,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonChip,
  IonLabel,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonFooter,
  IonIcon,
  IonMenu,
  IonMenuButton,
  IonMenuToggle,
  IonList,
  IonItem,
} from '@ionic/angular/standalone';
import { WoocommerceService } from '../services/woocommerce.service';
import { CartService } from '../services/cart.service';
import { PushService } from '../services/push.service';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonHeader, IonToolbar, IonTitle, IonContent, IonFooter,
    IonSelect, IonSelectOption,
    IonButtons, IonButton, IonBadge, IonIcon,
    IonMenu, IonMenuButton, IonMenuToggle,
    IonList, IonItem,
    IonSearchbar,
    IonChip, IonLabel,
    IonGrid, IonRow, IonCol,
    IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
    IonSpinner, IonRefresher, IonRefresherContent
  ],
})
export class HomePage implements OnInit {
  private woocommerceService = inject(WoocommerceService);
  private cartService = inject(CartService);
  private pushService = inject(PushService);
  private themeService = inject(ThemeService);
  sites = this.woocommerceService.getAllSites();
  activeSiteId = this.woocommerceService.getActiveSite().id;
  products: any[] = [];
  categories: any[] = [];
  isLoading = true;
  searchTerm = '';
  selectedCategoryId: number | null = null;
  cartCount$ = this.cartService.totalQuantity$;

  constructor() {}

  ngOnInit() {
    this.activeSiteId = this.woocommerceService.getActiveSite().id;
    this.ensureCredentialsForActiveSite().then(() => {
      this.loadCategories();
      this.loadProducts();
    });
  }

  toggleTheme() {
    this.themeService.toggle();
  }

  get selectedCategoryName(): string {
    if (this.selectedCategoryId === null) return '';
    return this.categories.find((c) => c?.id === this.selectedCategoryId)?.name ?? '';
  }

  loadProducts(event?: any) {
    const normalizedSearch = this.searchTerm.trim() || undefined;
    const categoryId = this.selectedCategoryId ?? undefined;

    this.woocommerceService.getProducts(1, 10, normalizedSearch, categoryId).subscribe({
      next: (data) => {
        this.products = data;
        this.isLoading = false;
        if (event) {
          event.target.complete();
        }
      },
      error: (error) => {
        console.error('Error fetching products', error);
        this.products = [];
        this.isLoading = false;
        if (event) {
          event.target.complete();
        }
      }
    });
  }

  loadCategories() {
    this.woocommerceService.getCategories().subscribe({
      next: (data) => {
        this.categories = Array.isArray(data) ? data : [];
      },
      error: () => {
        this.categories = [];
      },
    });
  }

  selectCategory(categoryId: number | null) {
    this.selectedCategoryId = categoryId;
    this.isLoading = true;
    this.loadProducts();
  }

  handleSearch(event: any) {
    const value = event?.detail?.value ?? '';
    this.searchTerm = String(value);
    this.isLoading = true;
    this.loadProducts();
  }

  handleRefresh(event: any) {
    this.isLoading = true;
    this.loadProducts(event);
  }

  addToCart(product: any, event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.cartService.addProduct(product, 1);
  }

  showPromoPreview() {
    void this.pushService.showExamplePromo();
  }

  async onSiteChange(id: string) {
    if (!id || id === this.activeSiteId) return;
    this.activeSiteId = id;
    if (!this.woocommerceService.hasCredentialsFor(id)) {
      // Pedir llaves sólo si no existen para ese sitio
      const consumerKey = prompt('Consumer Key para ' + id);
      const consumerSecret = consumerKey ? prompt('Consumer Secret para ' + id) : '';
      if (!consumerKey || !consumerSecret) {
        // Revertimos selección
        this.activeSiteId = this.woocommerceService.getActiveSite().id;
        return;
      }
      this.woocommerceService.setSiteCredentials(id, consumerKey, consumerSecret);
    }
    this.woocommerceService.setActiveSite(id);
    this.cartService.clear();
    this.isLoading = true;
    this.products = [];
    this.categories = [];
    this.loadCategories();
    this.loadProducts();
  }

  private async ensureCredentialsForActiveSite() {
    const id = this.activeSiteId;
    if (!this.woocommerceService.hasCredentialsFor(id)) {
      const consumerKey = prompt('Consumer Key para ' + id);
      const consumerSecret = consumerKey ? prompt('Consumer Secret para ' + id) : '';
      if (!consumerKey || !consumerSecret) {
        // Si no se proporcionan, volvemos a la tienda principal
        const main = this.sites.find((s) => s.id === 'main') || this.sites[0];
        this.activeSiteId = main.id;
        this.woocommerceService.setActiveSite(main.id);
        return;
      }
      this.woocommerceService.setSiteCredentials(id, consumerKey, consumerSecret);
      this.woocommerceService.setActiveSite(id);
    }
  }

  changeKeysForActiveSite() {
    const id = this.activeSiteId;
    const consumerKey = prompt('Nueva Consumer Key para ' + id);
    const consumerSecret = consumerKey ? prompt('Nuevo Consumer Secret para ' + id) : '';
    if (!consumerKey || !consumerSecret) {
      alert('No se actualizaron las llaves');
      return;
    }
    this.woocommerceService.setSiteCredentials(id, consumerKey, consumerSecret);
    this.isLoading = true;
    this.products = [];
    this.categories = [];
    this.loadCategories();
    this.loadProducts();
  }

  runDiagnostics() {
    this.isLoading = true;
    this.woocommerceService.getProducts(1, 1).subscribe({
      next: (data) => {
        this.isLoading = false;
        alert('Diagnóstico OK: se pudo acceder a /products en el sitio activo.');
        console.log('Diagnóstico productos', data);
      },
      error: (err) => {
        this.isLoading = false;
        alert('Diagnóstico falló: revisa la consola para detalles.');
        console.error('Diagnóstico error', err);
      },
    });
  }
}
