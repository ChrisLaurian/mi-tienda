import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  ToastController,
} from '@ionic/angular/standalone';
import { WoocommerceService } from '../services/woocommerce.service';
import { addIcons } from 'ionicons';
import {
  locationOutline,
  storefrontOutline,
  checkmarkCircle,
  navigateOutline,
} from 'ionicons/icons';

export interface Store {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  image?: string;
}

@Component({
  selector: 'app-store-selector',
  templateUrl: 'store-selector.page.html',
  styleUrls: ['store-selector.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
  ],
})
export class StoreSelectorPage implements OnInit {
  private woocommerceService = inject(WoocommerceService);
  private router = inject(Router);
  private toastController = inject(ToastController);

  stores: Store[] = [
    {
      id: 'main',
      name: 'Tienda Principal',
      address: 'Av. Principal #123, Centro',
      lat: 19.4326,
      lng: -99.1332,
      image: 'assets/stores/store-main.jpg',
    },
    {
      id: 'test',
      name: 'Sucursal Norte',
      address: 'Av. Norte #456, Col. Industrial',
      lat: 19.4826,
      lng: -99.1532,
      image: 'assets/stores/store-norte.jpg',
    },
    {
      id: 'test2',
      name: 'Sucursal Sur',
      address: 'Av. Sur #789, Col. Residencial',
      lat: 19.3926,
      lng: -99.1132,
      image: 'assets/stores/store-sur.jpg',
    },
  ];

  activeStoreId: string = '';
  isLoadingLocation = false;
  userLocation: { lat: number; lng: number } | null = null;
  nearestStoreId: string | null = null;

  constructor() {
    addIcons({
      locationOutline,
      storefrontOutline,
      checkmarkCircle,
      navigateOutline,
    });
  }

  ngOnInit() {
    this.activeStoreId = this.woocommerceService.getActiveSite().id;
  }

  selectStore(storeId: string) {
    this.woocommerceService.setActiveSite(storeId);
    this.activeStoreId = storeId;
    this.router.navigate(['/store']);
  }

  async detectLocation() {
    if (!navigator.geolocation) {
      const toast = await this.toastController.create({
        message: 'Tu navegador no soporta geolocalización.',
        duration: 3000,
        position: 'bottom',
        color: 'warning',
      });
      await toast.present();
      return;
    }

    this.isLoadingLocation = true;
    this.nearestStoreId = null;

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      this.userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      let minDistance = Infinity;
      let nearestId: string | null = null;

      this.stores.forEach((store) => {
        const distance = this.calculateDistance(
          this.userLocation!.lat,
          this.userLocation!.lng,
          store.lat,
          store.lng
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearestId = store.id;
        }
      });

      this.nearestStoreId = nearestId;
      this.selectStore(nearestId!);
    } catch (error) {
      const toast = await this.toastController.create({
        message: 'No se pudo obtener tu ubicación. Selecciona una tienda manualmente.',
        duration: 3000,
        position: 'bottom',
        color: 'warning',
      });
      await toast.present();
    } finally {
      this.isLoadingLocation = false;
    }
  }

  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  getDistanceToStore(store: Store): string {
    if (!this.userLocation) return '-';
    const distance = this.calculateDistance(
      this.userLocation.lat,
      this.userLocation.lng,
      store.lat,
      store.lng
    );
    return distance.toFixed(1);
  }
}
