import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, 
  IonList, IonItem, IonLabel, IonImg, IonThumbnail, 
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonSpinner, IonRefresher, IonRefresherContent
} from '@ionic/angular/standalone';
import { WoocommerceService } from '../services/woocommerce.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonList, IonItem, IonLabel, IonImg, IonThumbnail,
    IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
    IonSpinner, IonRefresher, IonRefresherContent
  ],
})
export class HomePage implements OnInit {
  private woocommerceService = inject(WoocommerceService);
  products: any[] = [];
  isLoading = true;

  constructor() {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts(event?: any) {
    this.woocommerceService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.isLoading = false;
        if (event) {
          event.target.complete();
        }
      },
      error: (error) => {
        console.error('Error fetching products', error);
        this.isLoading = false;
        if (event) {
          event.target.complete();
        }
      }
    });
  }

  handleRefresh(event: any) {
    this.isLoading = true;
    this.loadProducts(event);
  }
}
