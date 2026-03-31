import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonText,
  IonSpinner,
  AlertController,
  MenuController,
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    IonText,
    IonSpinner,
  ],
})
export class LoginPage implements OnInit {
  private themeService = inject(ThemeService);
  private router = inject(Router);
  private alertController = inject(AlertController);
  private menuController = inject(MenuController);

  username = '';
  password = '';
  isLoading = false;
  errorMessage = '';

  ngOnInit() {
    this.menuController.enable(false, 'main-menu');
  }

  toggleTheme() {
    this.themeService.toggle();
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  async forgotPassword() {
    const alert = await this.alertController.create({
      header: 'Recuperar Contraseña',
      message: 'Ingresa tu correo electrónico para recibir un enlace de recuperación.',
      inputs: [
        {
          name: 'email',
          type: 'email',
          placeholder: 'Correo electrónico',
        },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Enviar',
          handler: (data) => {
            if (data.email) {
              this.showMessage('Se ha enviado un enlace de recuperación a tu correo.');
            }
          },
        },
      ],
    });
    await alert.present();
  }

  goToSignup() {
    this.showMessage('Próximamente: Registro de usuarios');
  }

  async showMessage(message: string) {
    const alert = await this.alertController.create({
      header: 'Información',
      message: message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  async onLogin() {
    this.errorMessage = '';
    
    if (!this.username || !this.password) {
      this.errorMessage = 'Por favor ingresa usuario y contraseña';
      return;
    }

    this.isLoading = true;

    await new Promise(resolve => setTimeout(resolve, 800));

    if (this.username.toLowerCase() === 'admin' && this.password.toLowerCase() === 'root') {
      this.isLoading = false;
      this.router.navigate(['/store']);
    } else {
      this.isLoading = false;
      this.errorMessage = 'Usuario o contraseña incorrectos';
    }
  }
}
