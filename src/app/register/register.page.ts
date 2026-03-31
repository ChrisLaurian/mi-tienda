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

@Component({
  selector: 'app-register',
  templateUrl: 'register.page.html',
  styleUrls: ['register.page.scss'],
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
export class RegisterPage implements OnInit {
  private router = inject(Router);
  private alertController = inject(AlertController);
  private menuController = inject(MenuController);

  fullName = '';
  password = '';
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
    
    // Simple validation for demonstration
    if (!this.fullName || !this.email || !this.password) {
      this.errorMessage = 'Por favor completa los campos obligatorios.';
      return;
    }

    this.isLoading = true;

    // Simulate registration
    await new Promise(resolve => setTimeout(resolve, 1500));

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
  }
}
