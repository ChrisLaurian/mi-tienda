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

  fullName = '';
  password = '';
  confirmPassword = '';
  email = '';
  mobile = '';
  dob = '';
  isLoading = false;
  errorMessage = '';

  ngOnInit() {
    this.menuController.enable(false, 'main-menu');
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  async onRegister() {
    this.errorMessage = '';
    
    // Validación
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

    // Registrar usuario usando HttpClient de Angular
    this.authService.register({
      username: this.email,
      email: this.email,
      password: this.password,
      first_name: this.fullName,
      billing: {
        phone: this.mobile,
      },
    }).subscribe({
      next: async (response: any) => {
        console.log('Registration response:', response);
        this.isLoading = false;
        
        const alert = await this.alertController.create({
          header: 'Registro Exitoso',
          message: 'Tu cuenta ha sido creada. Ahora puedes iniciar sesión.',
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
