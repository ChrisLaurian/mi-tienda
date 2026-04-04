import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  PopoverController,
} from '@ionic/angular/standalone';
import { WoocommerceService } from '../../services/woocommerce.service';
import { addIcons } from 'ionicons';
import {
  storefrontOutline,
  checkmarkCircle,
  locationOutline,
} from 'ionicons/icons';

export interface StoreOption {
  id: string;
  name: string;
}

@Component({
  selector: 'app-store-selector-popover',
  templateUrl: './store-selector-popover.component.html',
  styleUrls: ['./store-selector-popover.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
  ],
})
export class StoreSelectorPopoverComponent implements OnInit {
  private woocommerceService = inject(WoocommerceService);
  private popoverController = inject(PopoverController);
  private router = inject(Router);
  
  stores: StoreOption[] = [];
  activeStoreId: string = '';
  
  constructor() {
    addIcons({
      storefrontOutline,
      checkmarkCircle,
      locationOutline,
    });
  }
  
  ngOnInit() {
    const allSites = this.woocommerceService.getAllSites();
    this.stores = allSites.map(s => ({ id: s.id, name: s.name }));
    this.activeStoreId = this.woocommerceService.getActiveSite().id;
  }
  
  async selectStore(storeId: string) {
    this.woocommerceService.setActiveSite(storeId);
    await this.popoverController.dismiss();
    window.location.reload();
  }
  
  goToStoreSelector() {
    this.popoverController.dismiss();
    this.router.navigate(['/store-selector']);
  }
}
