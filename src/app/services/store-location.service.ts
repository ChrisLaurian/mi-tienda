import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface StoreLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  postalCodeRanges: {
    start: string;
    end: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class StoreLocationService {
  
  private stores: StoreLocation[] = [];

  constructor() {
    this.loadStoresFromEnvironment();
  }

  private loadStoresFromEnvironment() {
    const envSites = (environment as any)?.woocommerceSites || [];
    this.stores = envSites
      .filter((site: any) => site.lat && site.lng)
      .map((site: any) => ({
        id: site.id,
        name: site.name,
        lat: site.lat,
        lng: site.lng,
        postalCodeRanges: site.postalCodeRanges || [],
      }));
  }

  getStoreByPostalCode(postalCode: string): StoreLocation | null {
    if (!postalCode || postalCode.length < 4) {
      return null;
    }

    const normalizedCode = postalCode.replace(/\D/g, '').substring(0, 5);
    
    for (const store of this.stores) {
      for (const range of store.postalCodeRanges) {
        if (normalizedCode >= range.start && normalizedCode <= range.end) {
          return store;
        }
      }
    }
    
    return this.stores.length > 0 ? this.stores[0] : null;
  }

  getAllStores(): StoreLocation[] {
    return this.stores;
  }

  getStoreById(id: string): StoreLocation | undefined {
    return this.stores.find(s => s.id === id);
  }

  calculateDistance(
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

  getNearestStoreByCoords(lat: number, lng: number): StoreLocation | null {
    if (this.stores.length === 0) return null;
    
    let minDistance = Infinity;
    let nearestStore = this.stores[0];

    for (const store of this.stores) {
      const distance = this.calculateDistance(lat, lng, store.lat, store.lng);
      if (distance < minDistance) {
        minDistance = distance;
        nearestStore = store;
      }
    }

    return nearestStore;
  }
}
