import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonButton,
  IonBadge,
  AlertController,
  MenuController,
} from '@ionic/angular/standalone';
import { CartService } from '../services/cart.service';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-profile',
  templateUrl: 'profile.page.html',
  styleUrls: ['profile.page.scss'],
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
export class ProfilePage implements OnInit {
  private cartService = inject(CartService);
  private themeService = inject(ThemeService);
  private alertController = inject(AlertController);
  private menuController = inject(MenuController);
  private router = inject(Router);
  cartCount$ = this.cartService.totalQuantity$;

  ngOnInit() {
    this.menuController.enable(true, 'main-menu');
  }

  user = {
    name: 'John Smith',
    email: 'johnsmith@example.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    dateOfBirth: '09 / 10 / 1991',
    phone: '+123 567 89000',
    points: 1250,
  };

  toggleTheme() {
    this.themeService.toggle();
  }

  goBack() {
    this.router.navigate(['/store']);
  }

  async editProfile() {
    const alert = await this.alertController.create({
      header: 'Editar Perfil',
      inputs: [
        {
          name: 'name',
          type: 'text',
          value: this.user.name,
          placeholder: 'Nombre completo',
        },
        {
          name: 'email',
          type: 'email',
          value: this.user.email,
          placeholder: 'Correo electrónico',
        },
        {
          name: 'phone',
          type: 'tel',
          value: this.user.phone,
          placeholder: 'Número de teléfono',
        },
        {
          name: 'dateOfBirth',
          type: 'text',
          value: this.user.dateOfBirth,
          placeholder: 'Fecha de nacimiento',
        },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (data) => {
            if (data.name && data.email) {
              this.user = { 
                ...this.user, 
                name: data.name, 
                email: data.email,
                phone: data.phone || this.user.phone,
                dateOfBirth: data.dateOfBirth || this.user.dateOfBirth,
              };
              this.showMessage('Perfil actualizado correctamente');
            }
          },
        },
      ],
    });

    await alert.present();
  }

  async showMessage(message: string) {
    const alert = await this.alertController.create({
      header: 'Información',
      message: message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
