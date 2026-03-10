import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonThumbnail,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { CartService } from '../services/cart.service';
import { WoocommerceService } from '../services/woocommerce.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonList,
    IonItem,
    IonThumbnail,
    IonLabel,
    IonButton,
    IonBadge,
  ],
})
export class CartPage {
  private cartService = inject(CartService);
  private woocommerceService = inject(WoocommerceService);

  items$ = this.cartService.items$;
  coupon$ = this.cartService.coupon$;
  totalQuantity$ = this.cartService.totalQuantity$;
  totalPrice$ = this.cartService.totalPrice$;

  ionViewWillEnter() {
    const items = this.cartService.getItemsSnapshot();
    const ids = items.map((i) => i.productId);
    if (ids.length === 0) return;

    this.woocommerceService.getProductsByIds(ids).subscribe({
      next: (products) => this.cartService.hydrateFromProducts(products),
      error: () => undefined,
    });
  }

  decrease(productId: number, currentQuantity: number) {
    this.cartService.setQuantity(productId, currentQuantity - 1);
  }

  increase(productId: number, currentQuantity: number) {
    this.cartService.setQuantity(productId, currentQuantity + 1);
  }

  remove(productId: number) {
    this.cartService.remove(productId);
  }

  clear() {
    this.cartService.clear();
  }

  clearCoupon() {
    this.cartService.clearCoupon();
  }
}
