import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonIcon,
  AlertController,
  MenuController,
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { cardOutline, radioButtonOn, radioButtonOff } from 'ionicons/icons';

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
  ],
})
export class PaymentPage implements OnInit {
  private router = inject(Router);
  private alertController = inject(AlertController);
  private menuController = inject(MenuController);

  constructor() {
    addIcons({ cardOutline, radioButtonOn, radioButtonOff });
  }

  ngOnInit() {
    this.menuController.enable(false, 'main-menu');
  }

  goBack() {
    this.router.navigate(['/cart']);
  }

  async onPay() {
    const alert = await this.alertController.create({
      header: '¡Pago Exitoso!',
      message: 'Gracias por tu compra.',
      buttons: [{
        text: 'OK',
        handler: () => {
          this.router.navigate(['/store']);
        }
      }],
    });
    await alert.present();
  }
}
