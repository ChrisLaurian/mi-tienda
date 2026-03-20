import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonBackButton,
  IonIcon,
  IonAvatar,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonCard,
  IonCardContent,
  IonFooter,
  IonInput,
  AlertController,
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
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonBackButton,
    IonIcon,
    IonAvatar,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonCard,
    IonCardContent,
    IonFooter,
    IonInput,
  ],
})
export class ProfilePage {
  private cartService = inject(CartService);
  private themeService = inject(ThemeService);
  private alertController = inject(AlertController);
  cartCount$ = this.cartService.totalQuantity$;

  user = {
    name: 'Usuario Mi Tienda',
    email: 'usuario@mitienda.com',
    avatar: 'https://ui-avatars.com/api/?name=Usuario+MT&background=005cbb&color=fff&size=128',
    points: 1250,
    memberSince: 'Enero 2024',
  };

  orders = [
    { id: 'ORD-001', date: '15 Mar 2026', total: 45000, status: 'Entregado' },
    { id: 'ORD-002', date: '10 Mar 2026', total: 32000, status: 'Enviado' },
    { id: 'ORD-003', date: '05 Mar 2026', total: 28500, status: 'Entregado' },
    { id: 'ORD-004', date: '28 Feb 2026', total: 67000, status: 'Entregado' },
  ];

  toggleTheme() {
    this.themeService.toggle();
  }

  async editField(field: string) {
    const currentValue = this.user[field as keyof typeof this.user];
    const title = field === 'name' ? 'Editar Nombre' : 'Editar Correo';
    const placeholder = field === 'name' ? 'Tu nombre' : 'Tu correo';

    const alert = await this.alertController.create({
      header: title,
      inputs: [
        {
          name: 'value',
          type: 'text',
          value: currentValue as string,
          placeholder: placeholder,
        },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (data) => {
            if (data.value && data.value.trim()) {
              this.user = { ...this.user, [field]: data.value.trim() };
            }
          },
        },
      ],
    });

    await alert.present();
  }

  async changePassword() {
    const alert = await this.alertController.create({
      header: 'Cambiar Contraseña',
      inputs: [
        {
          name: 'current',
          type: 'password',
          placeholder: 'Contraseña actual',
        },
        {
          name: 'new',
          type: 'password',
          placeholder: 'Nueva contraseña',
        },
        {
          name: 'confirm',
          type: 'password',
          placeholder: 'Confirmar nueva contraseña',
        },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Cambiar',
          handler: (data) => {
            if (!data.current || !data.new || !data.confirm) {
              this.showMessage('Completa todos los campos');
              return false;
            }
            if (data.new !== data.confirm) {
              this.showMessage('Las contraseñas no coinciden');
              return false;
            }
            if (data.new.length < 6) {
              this.showMessage('La contraseña debe tener al menos 6 caracteres');
              return false;
            }
            this.showMessage('Contraseña actualizada correctamente');
            return true;
          },
        },
      ],
    });

    await alert.present();
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
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (data) => {
            if (data.name && data.email) {
              this.user = { ...this.user, name: data.name, email: data.email };
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

  getStatusColor(status: string): string {
    switch (status) {
      case 'Entregado':
        return 'success';
      case 'Enviado':
        return 'primary';
      case 'Procesando':
        return 'warning';
      default:
        return 'medium';
    }
  }
}
