import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonButton,
  AlertController,
} from '@ionic/angular/standalone';
import { CartService, CartItem } from '../services/cart.service';
import { addIcons } from 'ionicons';
import { cartOutline, bagOutline, addOutline, removeOutline, trashOutline } from 'ionicons/icons';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonContent,
    IonIcon,
    IonButton,
  ],
})
export class CartPage implements OnInit {
  private router = inject(Router);
  private alertController = inject(AlertController);
  private cartService = inject(CartService);
  
  items$ = this.cartService.items$;
  total$ = this.cartService.totalPrice$;

  constructor() {
    addIcons({ cartOutline, bagOutline, addOutline, removeOutline, trashOutline });
  }

  ngOnInit() {}

  goBack() {
    this.router.navigate(['/store']);
  }

  increaseQuantity(item: CartItem) {
    this.cartService.setQuantity(item.productId, item.quantity + 1);
  }

  decreaseQuantity(item: CartItem) {
    if (item.quantity > 1) {
      this.cartService.setQuantity(item.productId, item.quantity - 1);
    } else {
      this.removeItem(item);
    }
  }

  async removeItem(item: CartItem) {
    const alert = await this.alertController.create({
      header: 'Eliminar producto',
      message: `¿Eliminar "${item.name}" del carrito?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.cartService.remove(item.productId);
          },
        },
      ],
    });
    await alert.present();
  }

  async clearCart() {
    const alert = await this.alertController.create({
      header: 'Vaciar carrito',
      message: '¿Eliminar todos los productos del carrito?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Vaciar',
          role: 'destructive',
          handler: () => {
            this.cartService.clear();
          },
        },
      ],
    });
    await alert.present();
  }

  getItemTotal(item: CartItem): number {
    return item.price * item.quantity;
  }

  goToCheckout() {
    this.router.navigate(['/payment']);
  }
}
