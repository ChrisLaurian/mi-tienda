import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonText,
  IonSpinner,
  AlertController,
  MenuController,
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { StoreLocationService } from '../services/store-location.service';
import { WoocommerceService } from '../services/woocommerce.service';

@Component({
  selector: 'app-register',
  templateUrl: 'register.page.html',
  styleUrls: ['register.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonContent,
    IonButton,
    IonText,
    IonSpinner,
  ],
})
export class RegisterPage implements OnInit {
  private router = inject(Router);
  private alertController = inject(AlertController);
  private menuController = inject(MenuController);
  private authService = inject(AuthService);
  private storeLocationService = inject(StoreLocationService);
  private woocommerceService = inject(WoocommerceService);

  fullName = '';
  password = '';
  confirmPassword = '';
  email = '';
  mobile = '';
  dob = '';
  postalCode = '';
  isLoading = false;
  errorMessage = '';
  suggestedStore: string | null = null;

  ngOnInit() {
    this.menuController.enable(false, 'main-menu');
  }

  onPostalCodeChange() {
    if (this.postalCode && this.postalCode.length >= 4) {
      const store = this.storeLocationService.getStoreByPostalCode(this.postalCode);
      if (store) {
        this.suggestedStore = store.name;
        this.woocommerceService.setActiveSite(store.id);
      }
    }
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  async onRegister() {
    this.errorMessage = '';
    
    if (!this.fullName || !this.email || !this.password) {
      this.errorMessage = 'Por favor completa los campos obligatorios.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }

    this.isLoading = true;

    this.authService.register({
      username: this.email,
      email: this.email,
      password: this.password,
      first_name: this.fullName,
      billing: {
        phone: this.mobile,
        postcode: this.postalCode,
      },
    }).subscribe({
      next: async (response: any) => {
        console.log('Registration response:', response);
        this.isLoading = false;
        
        let message = 'Tu cuenta ha sido creada. Ahora puedes iniciar sesión.';
        if (this.suggestedStore) {
          message += ` Se te ha asignado la tienda ${this.suggestedStore}.`;
        }
        
        const alert = await this.alertController.create({
          header: 'Registro Exitoso',
          message: message,
          buttons: [{
            text: 'OK',
            handler: () => {
              this.router.navigate(['/login']);
            }
          }],
        });
        await alert.present();
      },
      error: async (error: any) => {
        console.error('Registration error:', error);
        this.isLoading = false;
        
        const alert = await this.alertController.create({
          header: 'Error',
          message: 'No se pudo completar el registro. Por favor intenta de nuevo.',
          buttons: ['OK'],
        });
        await alert.present();
      }
    });
  }
}
