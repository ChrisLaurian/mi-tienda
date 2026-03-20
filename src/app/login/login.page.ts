import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonText,
  IonSpinner,
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
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonInput,
    IonItem,
    IonLabel,
    IonText,
    IonSpinner,
  ],
})
export class LoginPage {
  private themeService = inject(ThemeService);
  private router = inject(Router);

  username = '';
  password = '';
  isLoading = false;
  errorMessage = '';

  toggleTheme() {
    this.themeService.toggle();
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
      this.router.navigate(['/home']);
    } else {
      this.isLoading = false;
      this.errorMessage = 'Usuario o contraseña incorrectos';
    }
  }
}
