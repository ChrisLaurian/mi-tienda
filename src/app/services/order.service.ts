import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, map } from 'rxjs';
import { WoocommerceService } from './woocommerce.service';

export interface OrderItem {
  id: number;
  name: string;
  product_id: number;
  quantity: number;
  price: number;
  image?: string;
}

export interface Order {
  id: number;
  number: string;
  status: 'pending' | 'processing' | 'on-hold' | 'completed' | 'cancelled' | 'refunded' | 'failed';
  date_created: string;
  total: string;
  total_formatted: string;
  line_items: OrderItem[];
  billing_first_name: string;
  billing_last_name: string;
  payment_method: string;
}

const STORAGE_KEY = 'local_orders';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);
  private woocommerceService = inject(WoocommerceService);

  constructor() {}

  getOrders(customerId?: number): Observable<Order[]> {
    const userId = customerId || localStorage.getItem('user_id');
    
    if (userId) {
      return this.woocommerceService.getOrdersByCustomer(Number(userId)).pipe(
        map((orders: any[]) => orders.map(this.mapOrder))
      );
    }
    
    return this.getLocalOrders();
  }

  getOrderById(orderId: number): Observable<Order | null> {
    return this.woocommerceService.getOrderById(orderId).pipe(
      map((order: any) => this.mapOrder(order))
    );
  }

  private mapOrder(order: any): Order {
    const items: OrderItem[] = (order.line_items || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      product_id: item.product_id,
      quantity: item.quantity,
      price: parseFloat(item.price) || 0,
      image: item.image?.src || undefined
    }));

    const total = parseFloat(order.total) || 0;
    
    return {
      id: order.id,
      number: order.number || String(order.id),
      status: order.status || 'pending',
      date_created: order.date_created,
      total: order.total,
      total_formatted: `S/ ${total.toFixed(2)}`,
      line_items: items,
      billing_first_name: order.billing?.first_name || '',
      billing_last_name: order.billing?.last_name || '',
      payment_method: order.payment_method_title || order.payment_method || ''
    };
  }

  getLocalOrders(): Observable<Order[]> {
    return new Observable(observer => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const orders = stored ? JSON.parse(stored) : [];
        observer.next(orders);
        observer.complete();
      } catch {
        observer.next([]);
        observer.complete();
      }
    });
  }

  saveLocalOrder(order: Order): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const orders: Order[] = stored ? JSON.parse(stored) : [];
      const existingIndex = orders.findIndex(o => o.id === order.id);
      
      if (existingIndex >= 0) {
        orders[existingIndex] = order;
      } else {
        orders.unshift(order);
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch {}
  }

  getOrdersByStatus(orders: Order[], status: string): Order[] {
    if (status === 'all') return orders;
    return orders.filter(o => o.status === status);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': 'Pendiente',
      'processing': 'En Proceso',
      'on-hold': 'En Espera',
      'completed': 'Completado',
      'cancelled': 'Cancelado',
      'refunded': 'Reembolsado',
      'failed': 'Fallido'
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'pending': '#FF9800',
      'processing': '#2196F3',
      'on-hold': '#9C27B0',
      'completed': '#4CAF50',
      'cancelled': '#F44336',
      'refunded': '#607D8B',
      'failed': '#E91E63'
    };
    return colors[status] || '#999';
  }
}
