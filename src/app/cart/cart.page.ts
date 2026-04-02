import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonButton,
  IonBadge,
  AlertController,
} from '@ionic/angular/standalone';
import { CartService } from '../services/cart.service';
import { addIcons } from 'ionicons';
import { cartOutline, bagOutline } from 'ionicons/icons';

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
    IonBadge,
  ],
})
export class CartPage implements OnInit {
  private router = inject(Router);
  private cartService = inject(CartService);
  
  items$ = this.cartService.items$;

  constructor() {
    addIcons({ cartOutline, bagOutline });
  }

  ngOnInit() {}

  goBack() {
    this.router.navigate(['/store']);
  }
}
