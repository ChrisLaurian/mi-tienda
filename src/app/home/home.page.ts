import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonFooter,
  IonToolbar,
  IonTitle,
} from '@ionic/angular/standalone';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonContent,
    IonButton,
    IonFooter,
    IonToolbar,
    IonTitle,
  ],
})
export class HomePage {
  private themeService = inject(ThemeService);
  private router = inject(Router);

  toggleTheme() {
    this.themeService.toggle();
  }

  onSignUp() {
    this.router.navigate(['/register']);
  }
}
