import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  IonBadge,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { WoocommerceService } from '../services/woocommerce.service';
import { CartService } from '../services/cart.service';

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
  ],
})
export class ProductDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private woocommerceService = inject(WoocommerceService);
  private cartService = inject(CartService);

  isLoading = true;
  product: any | null = null;
  cartCount$ = this.cartService.totalQuantity$;

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
    this.cartService.addProduct(this.product, 1);
  }
}
