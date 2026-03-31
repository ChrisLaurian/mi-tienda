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
  selector: 'app-set-password',
  templateUrl: 'set-password.page.html',
  styleUrls: ['../register/register.page.scss'], // Reutilizamos estilos base
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
export class SetPasswordPage implements OnInit {
  private router = inject(Router);
  private alertController = inject(AlertController);
  private menuController = inject(MenuController);

  password = '';
  confirmPassword = '';
  isLoading = false;
  errorMessage = '';

  ngOnInit() {
    this.menuController.enable(false, 'main-menu');
  }

  goBack() {
    this.router.navigate(['/login']);
  }

  async onCreatePassword() {
    this.errorMessage = '';
    
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }
    
    if (!this.password) {
      this.errorMessage = 'Por favor ingresa una contraseña.';
      return;
    }

    this.isLoading = true;

    // Simulación de API
    await new Promise(resolve => setTimeout(resolve, 1500));

    this.isLoading = false;
    const alert = await this.alertController.create({
      header: 'Éxito',
      message: 'Tu contraseña ha sido actualizada.',
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
