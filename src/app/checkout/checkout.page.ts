import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Browser } from '@capacitor/browser';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
  IonText,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { CartService } from '../services/cart.service';
import { WoocommerceService } from '../services/woocommerce.service';
import { environment } from '../../environments/environment';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.page.html',
  styleUrls: ['./checkout.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonButton,
    IonText,
    IonSpinner,
  ],
})
export class CheckoutPage implements OnInit, OnDestroy {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private cartService = inject(CartService);
  private woocommerceService = inject(WoocommerceService);
  private themeService = inject(ThemeService);

  isSubmitting = false;
  isCheckingStatus = false;
  errorMessage = '';
  createdOrder: any | null = null;
  paymentUrl = '';
  isPaid = false;
  private removeBrowserFinishedListener: (() => void) | null = null;

  form = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required]],
    address1: ['', [Validators.required]],
    city: ['', [Validators.required]],
    state: [''],
    postcode: [''],
    country: ['', [Validators.required]],
    notes: [''],
  });

  async ngOnInit() {
    const items = this.cartService.getItemsSnapshot();
    if (items.length === 0) {
      this.router.navigateByUrl('/cart');
    }

    const handle = await Browser.addListener('browserFinished', () => {
      if (!this.createdOrder?.id) return;
      this.refreshOrderStatus();
    });
    this.removeBrowserFinishedListener = () => handle.remove();
  }

  ngOnDestroy() {
    this.removeBrowserFinishedListener?.();
  }

  submit() {
    this.errorMessage = '';
    this.createdOrder = null;
    this.isPaid = false;
    this.paymentUrl = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const items = this.cartService.getItemsSnapshot();
    if (items.length === 0) {
      this.router.navigateByUrl('/cart');
      return;
    }

    const value = this.form.getRawValue();

    const billing = {
      first_name: value.firstName,
      last_name: value.lastName,
      email: value.email,
      phone: value.phone,
      address_1: value.address1,
      city: value.city,
      state: value.state || '',
      postcode: value.postcode || '',
      country: value.country,
    };

    const shipping = {
      first_name: value.firstName,
      last_name: value.lastName,
      address_1: value.address1,
      city: value.city,
      state: value.state || '',
      postcode: value.postcode || '',
      country: value.country,
    };

    const coupon = this.cartService.getCouponSnapshot();
    const payload = {
      status: 'pending',
      set_paid: false,
      customer_note: value.notes || '',
      billing,
      shipping,
      line_items: items.map((item) => {
        const unit = Number(item.price) || 0;
        const qty = Number(item.quantity) || 1;
        const total = (unit * qty).toFixed(2);
        const meta: Array<{ key: string; value: string }> = [];
        if (Array.isArray(item.topics) && item.topics.length > 0) {
          for (const t of item.topics) {
            const parts: string[] = [];
            for (const o of t.options || []) {
              const part = (o.price || 0) > 0 ? `${o.label} (+${(o.price || 0).toFixed(2)})` : o.label;
              parts.push(part);
            }
            if (parts.length > 0) {
              meta.push({ key: t.label, value: parts.join(', ') });
            }
          }
          try {
            meta.push({ key: '_topics_json', value: JSON.stringify(item.topics) });
          } catch {
            // ignore json error
          }
        }
        return {
          product_id: item.productId,
          quantity: qty,
          subtotal: total,
          total: total,
          meta_data: meta,
        };
      }),
      coupon_lines: coupon ? [{ code: coupon }] : [],
    };

    this.isSubmitting = true;
    this.woocommerceService.createOrder(payload).subscribe({
      next: async (order) => {
        this.createdOrder = order;
        this.isSubmitting = false;
        this.paymentUrl = this.buildPaymentUrl(order);
        await this.openPaymentIfPossible();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err?.error?.message || 'No se pudo crear la orden.';
      },
    });
  }

  async payNow() {
    await this.openPaymentIfPossible();
  }

  refreshOrderStatus() {
    const id = Number(this.createdOrder?.id);
    if (!Number.isFinite(id) || id <= 0) return;

    this.isCheckingStatus = true;
    this.woocommerceService.getOrderById(id).subscribe({
      next: (order) => {
        this.createdOrder = order;
        this.isPaid = this.isOrderPaid(order);
        if (this.isPaid) {
          this.cartService.clear();
        }
        this.isCheckingStatus = false;
      },
      error: () => {
        this.isCheckingStatus = false;
      },
    });
  }

  private buildPaymentUrl(order: any): string {
    const orderId = Number(order?.id);
    const key = String(order?.order_key ?? order?.key ?? '');
    if (!Number.isFinite(orderId) || orderId <= 0 || !key) return '';

    const base = String(environment.woocommerce.url || '').replace(/\/+$/, '');
    if (!base) return '';

    const encodedKey = encodeURIComponent(key);
    return `${base}/index.php/checkout/order-pay/${orderId}/?pay_for_order=true&key=${encodedKey}`;
  }

  private isOrderPaid(order: any): boolean {
    const status = String(order?.status ?? '');
    return status === 'processing' || status === 'completed';
  }

  private async openPaymentIfPossible(): Promise<boolean> {
    const url = this.paymentUrl;
    if (!url) return false;

    try {
      await Browser.open({ url });
      return true;
    } catch {
      try {
        window.open(url, '_blank');
        return true;
      } catch {
        return false;
      }
    }
  }

  toggleTheme() {
    this.themeService.toggle();
  }
}
