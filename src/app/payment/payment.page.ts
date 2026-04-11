import { Component, inject, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonIcon,
  AlertController,
  MenuController,
  IonInput,
  IonItem,
  IonLabel,
  IonSpinner,
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { cardOutline, radioButtonOn, radioButtonOff, lockClosedOutline } from 'ionicons/icons';
import { environment } from '../../environments/environment';
import { WoocommerceService } from '../services/woocommerce.service';
import { CartService } from '../services/cart.service';

declare var Culqi: any;

@Component({
  selector: 'app-payment',
  templateUrl: 'payment.page.html',
  styleUrls: ['payment.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonSpinner,
  ],
})
export class PaymentPage implements OnInit, AfterViewInit {
  private router = inject(Router);
  private alertController = inject(AlertController);
  private menuController = inject(MenuController);
  private woocommerceService = inject(WoocommerceService);
  private cartService = inject(CartService);

  total$ = this.cartService.totalPrice$;

  constructor() {
    addIcons({ cardOutline, radioButtonOn, radioButtonOff, lockClosedOutline });
  }

  ngOnInit() {
    this.menuController.enable(false, 'main-menu');
  }

  ngAfterViewInit() {
    this.initCulqi();
  }

  initCulqi() {
    if (typeof Culqi !== 'undefined') {
      Culqi.init({
        currency: 'PEN',
        lang: 'es',
      });
    }
  }

  goBack() {
    this.router.navigate(['/cart']);
  }

  cardNumber = '';
  cardExpiry = '';
  cardCVV = '';
  cardName = '';
  isProcessing = false;

  guestName = '';
  guestEmail = '';
  guestPhone = '';

  isLoggedIn(): boolean {
    return !!localStorage.getItem('user_id');
  }

  async onPay() {
    if (!this.cardNumber || !this.cardExpiry || !this.cardCVV || !this.cardName) {
      this.showAlert('Error', 'Por favor completa todos los campos de la tarjeta');
      return;
    }

    if (!this.cardNumber.startsWith('4111') && !this.cardNumber.startsWith('5555')) {
      this.showAlert('Tarjeta inválida', 'Usa una tarjeta de prueba: 4111111111111111 o 5555555555554444');
      return;
    }

    const isLoggedIn = this.isLoggedIn();
    
    let firstName: string;
    let lastName: string;
    let userEmail: string;
    let userId: string | null = null;

    if (isLoggedIn) {
      userId = localStorage.getItem('user_id');
      const userName = localStorage.getItem('user_name') || 'Cliente';
      const nameParts = userName.split(' ');
      firstName = nameParts[0] || 'Cliente';
      lastName = nameParts.slice(1).join(' ') || 'App';
      userEmail = localStorage.getItem('user_email') || 'cliente@ejemplo.com';
    } else {
      if (!this.guestName || !this.guestEmail || !this.guestPhone) {
        this.showAlert('Datos incompletos', 'Por favor ingresa tu nombre, email y teléfono');
        return;
      }
      const nameParts = this.guestName.split(' ');
      firstName = nameParts[0] || 'Cliente';
      lastName = nameParts.slice(1).join(' ') || 'Invitado';
      userEmail = this.guestEmail;
    }

    this.isProcessing = true;

    const items = this.cartService.getItemsSnapshot();

    const payload: any = {
      status: 'processing',
      set_paid: true,
      payment_method: 'culqi',
      payment_method_title: isLoggedIn ? 'Tarjeta de Crédito/Débito (Culqi)' : 'Tarjeta de Crédito/Débito (Culqi) - Invitado',
      billing: {
        first_name: firstName,
        last_name: lastName,
        email: userEmail,
        phone: isLoggedIn ? '999999999' : this.guestPhone,
      },
      shipping: {
        first_name: firstName,
        last_name: lastName,
      },
      line_items: items.map(item => ({
        product_id: item.productId,
        quantity: item.quantity,
        total: (item.price * item.quantity).toFixed(2)
      }))
    };

    if (userId) {
      payload.customer = parseInt(userId);
    }

    this.woocommerceService.createOrder(payload).subscribe({
      next: (order) => {
        this.isProcessing = false;
        this.cartService.clear();
        this.showAlert('¡Pago Exitoso!', `Orden #${order.number} creada en WooCommerce`);
        this.router.navigate(['/store']);
      },
      error: (err) => {
        this.isProcessing = false;
        this.showAlert('Error', 'No se pudo crear la orden: ' + (err?.message || 'Error desconocido'));
      }
    });
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
