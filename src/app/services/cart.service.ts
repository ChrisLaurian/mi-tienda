import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';

export type CartItem = {
  productId: number;
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
};

const STORAGE_KEY = 'cart_items_v1';
const STORAGE_COUPON_KEY = 'cart_coupon_v1';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly itemsSubject = new BehaviorSubject<CartItem[]>(this.readFromStorage());
  readonly items$ = this.itemsSubject.asObservable();

  private readonly couponSubject = new BehaviorSubject<string>(this.readCouponFromStorage());
  readonly coupon$ = this.couponSubject.asObservable();

  readonly totalQuantity$ = this.items$.pipe(
    map((items) => items.reduce((sum, item) => sum + item.quantity, 0))
  );

  readonly totalPrice$ = this.items$.pipe(
    map((items) => items.reduce((sum, item) => sum + item.quantity * item.price, 0))
  );

  addProduct(product: any, quantity: number = 1) {
    const productId = Number(product?.id);
    if (!Number.isFinite(productId)) return;

    const name = String(product?.name ?? '');
    const price = Number(product?.price ?? 0);
    const imageUrl = product?.images?.[0]?.src ? String(product.images[0].src) : undefined;

    const safeQuantity = Math.max(1, Number(quantity) || 1);
    const nextItems = [...this.itemsSubject.value];
    const existingIndex = nextItems.findIndex((i) => i.productId === productId);

    if (existingIndex >= 0) {
      const existing = nextItems[existingIndex];
      nextItems[existingIndex] = { ...existing, quantity: existing.quantity + safeQuantity };
    } else {
      nextItems.push({
        productId,
        name,
        price: Number.isFinite(price) ? price : 0,
        imageUrl,
        quantity: safeQuantity,
      });
    }

    this.setItems(nextItems);
  }

  setQuantity(productId: number, quantity: number) {
    const safeProductId = Number(productId);
    if (!Number.isFinite(safeProductId)) return;

    const nextQuantity = Math.floor(Number(quantity));
    const nextItems = this.itemsSubject.value
      .map((item) => (item.productId === safeProductId ? { ...item, quantity: nextQuantity } : item))
      .filter((item) => item.quantity > 0);

    this.setItems(nextItems);
  }

  remove(productId: number) {
    const safeProductId = Number(productId);
    if (!Number.isFinite(safeProductId)) return;
    this.setItems(this.itemsSubject.value.filter((i) => i.productId !== safeProductId));
  }

  clear() {
    this.setItems([]);
    this.setCouponInternal('');
  }

  getItemsSnapshot(): CartItem[] {
    return this.itemsSubject.value;
  }

  getCouponSnapshot(): string {
    return this.couponSubject.value;
  }

  setCoupon(code: string) {
    const next = String(code ?? '').trim();
    this.setCouponInternal(next);
  }

  clearCoupon() {
    this.setCouponInternal('');
  }

  hydrateFromProducts(products: any[]) {
    if (!Array.isArray(products) || products.length === 0) return;
    const byId = new Map<number, any>();
    for (const p of products) {
      const id = Number(p?.id);
      if (Number.isFinite(id) && id > 0) byId.set(id, p);
    }

    const nextItems = this.itemsSubject.value.map((item) => {
      const product = byId.get(item.productId);
      if (!product) return item;

      const name = String(product?.name ?? item.name ?? '');
      const price = Number(product?.price ?? item.price ?? 0);
      const imageUrl = product?.images?.[0]?.src ? String(product.images[0].src) : item.imageUrl;

      return {
        ...item,
        name,
        price: Number.isFinite(price) ? price : item.price,
        imageUrl,
      };
    });

    this.setItems(nextItems);
  }

  private setItems(items: CartItem[]) {
    this.itemsSubject.next(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      return;
    }
  }

  private setCouponInternal(code: string) {
    this.couponSubject.next(code);
    try {
      localStorage.setItem(STORAGE_COUPON_KEY, code);
    } catch {
      return;
    }
  }

  private readFromStorage(): CartItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((i) => ({
          productId: Number(i?.productId),
          name: String(i?.name ?? ''),
          price: Number(i?.price ?? 0),
          imageUrl: i?.imageUrl ? String(i.imageUrl) : undefined,
          quantity: Number(i?.quantity ?? 0),
        }))
        .filter((i) => Number.isFinite(i.productId) && i.productId > 0 && Number.isFinite(i.quantity) && i.quantity > 0);
    } catch {
      return [];
    }
  }

  private readCouponFromStorage(): string {
    try {
      return String(localStorage.getItem(STORAGE_COUPON_KEY) ?? '');
    } catch {
      return '';
    }
  }
}
