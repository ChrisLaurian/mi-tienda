import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonButton,
  IonSpinner,
  AlertController,
  MenuController,
} from '@ionic/angular/standalone';
import { CartService } from '../services/cart.service';
import { AuthService } from '../services/auth.service';
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
    IonSpinner,
  ],
})
export class ProfilePage implements OnInit {
  private cartService = inject(CartService);
  private themeService = inject(ThemeService);
  private authService = inject(AuthService);
  private alertController = inject(AlertController);
  private menuController = inject(MenuController);
  private router = inject(Router);
  
  cartCount$ = this.cartService.totalQuantity$;

  isLoading = true;
  isLoggedIn = false;
  isAdminUser = false;

  user: any = {
    name: 'Usuario',
    email: 'usuario@mitienda.com',
    avatar: 'https://ui-avatars.com/api/?name=Usuario&background=FF6B35&color=fff&size=200',
    dateOfBirth: '',
    phone: '',
    address: '',
    city: '',
    postcode: '',
    points: 0,
  };

  ngOnInit() {
    this.menuController.enable(true, 'main-menu');
    this.checkLoginStatus();
  }

  checkLoginStatus() {
    const token = localStorage.getItem('access_token');
    const userName = localStorage.getItem('user_name');
    
    if (token) {
      this.isLoggedIn = true;
      if (userName) {
        this.user.name = userName;
        this.user.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=FF6B35&color=fff&size=200`;
      }
      this.loadUserData();
    } else {
      this.isLoggedIn = false;
      this.isLoading = false;
    }
  }

  loadUserData() {
    this.isLoading = true;
    
    const userName = localStorage.getItem('user_name');
    const userEmail = localStorage.getItem('user_email');
    const userId = localStorage.getItem('user_id');
    const userRole = localStorage.getItem('user_role');
    
    this.isAdminUser = userRole === 'administrator' || userRole === 'admin';
    
    this.user = {
      name: userName || 'Usuario',
      email: userEmail || '',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'Usuario')}&background=FF6B35&color=fff&size=200`,
      dateOfBirth: '',
      phone: '',
      address: '',
      city: '',
      postcode: '',
      points: 0,
      userId: userId || '',
    };
    
    this.isLoading = false;
  }

  toggleTheme() {
    this.themeService.toggle();
  }

  goBack() {
    this.router.navigate(['/store']);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
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
          placeholder: 'Fecha de nacimiento (DD/MM/AAAA)',
        },
        {
          name: 'address',
          type: 'text',
          value: this.user.address,
          placeholder: 'Dirección',
        },
        {
          name: 'city',
          type: 'text',
          value: this.user.city,
          placeholder: 'Ciudad',
        },
        {
          name: 'postcode',
          type: 'text',
          value: this.user.postcode,
          placeholder: 'Código Postal',
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
                address: data.address || this.user.address,
                city: data.city || this.user.city,
                postcode: data.postcode || this.user.postcode,
              };
              this.showMessage('Perfil actualizado correctamente');
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
          name: 'currentPassword',
          type: 'password',
          placeholder: 'Contraseña actual',
        },
        {
          name: 'newPassword',
          type: 'password',
          placeholder: 'Nueva contraseña',
        },
        {
          name: 'confirmPassword',
          type: 'password',
          placeholder: 'Confirmar nueva contraseña',
        },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Cambiar',
          handler: (data) => {
            if (!data.currentPassword || !data.newPassword || !data.confirmPassword) {
              this.showMessage('Por favor completa todos los campos');
              return false;
            }
            if (data.newPassword !== data.confirmPassword) {
              this.showMessage('Las contraseñas no coinciden');
              return false;
            }
            if (data.newPassword.length < 6) {
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

  async showMessage(message: string) {
    const alert = await this.alertController.create({
      header: 'Información',
      message: message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
