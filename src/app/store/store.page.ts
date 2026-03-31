import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonBadge,
  IonContent,
  IonIcon,
  IonMenu,
  IonHeader,
  IonTitle,
  IonList,
  IonItem,
  IonLabel,
  IonFooter,
  IonToolbar,
  IonSpinner,
  MenuController,
} from '@ionic/angular/standalone';
import { WoocommerceService } from '../services/woocommerce.service';
import { CartService } from '../services/cart.service';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-store',
  templateUrl: 'store.page.html',
  styleUrls: ['store.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonBadge,
    IonContent,
    IonIcon,
    IonMenu,
    IonHeader,
    IonTitle,
    IonList,
    IonItem,
    IonLabel,
    IonFooter,
    IonToolbar,
    IonSpinner,
  ],
})
export class StorePage implements OnInit {
  private woocommerceService = inject(WoocommerceService);
  private cartService = inject(CartService);
  private themeService = inject(ThemeService);
  private menuController = inject(MenuController);
  
  products: any[] = [];
  categories: any[] = [];
  isLoading = true;
  searchTerm = '';
  selectedCategoryId: number | null = null;
  cartCount$ = this.cartService.totalQuantity$;

  // Categorías con iconos de Ionic
  categoryIcons: { id: number | null; name: string; icon: string }[] = [
    { id: null, name: 'Todos', icon: 'apps-outline' },
  ];

  ngOnInit() {
    this.menuController.enable(true, 'main-menu');
    this.loadCategories();
    this.loadProducts();
  }

  toggleTheme() {
    this.themeService.toggle();
  }

  loadCategories() {
    this.woocommerceService.getCategories().subscribe({
      next: (data) => {
        this.categories = data || [];
        // Mapear categorías de WooCommerce a iconos
        const icons = ['restaurant-outline', 'pizza-outline', 'beer-outline', 'cafe-outline', 'nutrition-outline', 'ice-cream-outline', 'fast-food-outline', 'fish-outline'];
        this.categoryIcons = [
          { id: null, name: 'Todos', icon: 'apps-outline' },
          ...this.categories.map((cat: any, index: number) => ({
            id: cat.id,
            name: cat.name,
            icon: icons[index % icons.length]
          }))
        ];
      },
      error: () => {
        this.categories = [];
      }
    });
  }

  selectCategory(categoryId: number | null) {
    this.selectedCategoryId = categoryId;
    this.isLoading = true;
    this.loadProducts();
  }

  loadProducts() {
    this.isLoading = true;
    this.woocommerceService.getProducts(1, 20).subscribe({
      next: (data) => {
        this.products = data || [];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching products', error);
        this.products = [];
        this.isLoading = false;
      }
    });
  }

  handleSearch(event: any) {
    const value = event?.target?.value ?? '';
    this.searchTerm = String(value);
    if (this.searchTerm.trim()) {
      this.isLoading = true;
      this.woocommerceService.getProducts(1, 20, this.searchTerm).subscribe({
        next: (data) => {
          this.products = data || [];
          this.isLoading = false;
        },
        error: () => {
          this.products = [];
          this.isLoading = false;
        }
      });
    } else {
      this.loadProducts();
    }
  }

  getProductImage(product: any): string {
    if (product.images && product.images.length > 0) {
      return product.images[0].src;
    }
    return 'assets/placeholder.png';
  }

  getProductPrice(product: any): string {
    return product.price || product.regular_price || '$0.00';
  }

  getBestSellers(): any[] {
    return this.products.slice(0, 4);
  }

  getRecommended(): any[] {
    return this.products.slice(0, 6);
  }
}
