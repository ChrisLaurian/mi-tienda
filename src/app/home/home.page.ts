import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonBadge,
  IonButton,
  IonButtons,
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
} from '@ionic/angular/standalone';
import { WoocommerceService } from '../services/woocommerce.service';
import { CartService } from '../services/cart.service';
import { PushService } from '../services/push.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButtons, IonButton, IonBadge,
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
  products: any[] = [];
  categories: any[] = [];
  isLoading = true;
  searchTerm = '';
  selectedCategoryId: number | null = null;
  cartCount$ = this.cartService.totalQuantity$;

  constructor() {}

  ngOnInit() {
    this.loadCategories();
    this.loadProducts();
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
}
