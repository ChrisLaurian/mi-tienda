import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { CartService } from './cart.service';

type PromoPayload = {
  type?: string;
  coupon?: string;
  code?: string;
  title?: string;
  body?: string;
};

@Injectable({ providedIn: 'root' })
export class PushService {
  private router = inject(Router);
  private alertController = inject(AlertController);
  private cartService = inject(CartService);

  private initialized = false;

  async init() {
    if (this.initialized) return;
    this.initialized = true;

    if (!Capacitor.isNativePlatform()) return;

    const permissionStatus = await PushNotifications.requestPermissions();
    if (permissionStatus.receive !== 'granted') return;

    await PushNotifications.register();

    await PushNotifications.addListener('registration', (token) => {
      try {
        localStorage.setItem('push_token_v1', token.value);
      } catch {
        return;
      }
    });

    await PushNotifications.addListener('pushNotificationReceived', async (notification) => {
      const payload = (notification?.data ?? {}) as PromoPayload;
      await this.handlePromo(payload, notification?.title, notification?.body);
    });

    await PushNotifications.addListener('pushNotificationActionPerformed', async (action) => {
      const payload = (action?.notification?.data ?? {}) as PromoPayload;
      await this.handlePromo(payload, action?.notification?.title, action?.notification?.body);
    });
  }

  async showExamplePromo() {
    await this.handlePromo({
      type: 'promo',
      coupon: 'PROMO20',
      title: 'Descuento 20%',
      body: 'Acepta este descuento de 20% para tu compra.',
    });
  }

  private async handlePromo(payload: PromoPayload, fallbackTitle?: string, fallbackBody?: string) {
    const type = String(payload?.type ?? '').toLowerCase();
    if (type && type !== 'promo') return;

    const coupon = String(payload?.coupon ?? payload?.code ?? '').trim();
    if (!coupon) return;

    const title = String(payload?.title ?? fallbackTitle ?? 'Descuento disponible');
    const message = String(payload?.body ?? fallbackBody ?? `Acepta el descuento usando el cupón ${coupon}.`);

    const alert = await this.alertController.create({
      header: title,
      message,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Aceptar',
          handler: () => {
            this.cartService.setCoupon(coupon);
            this.router.navigateByUrl('/cart');
          },
        },
      ],
    });

    await alert.present();
  }
}
