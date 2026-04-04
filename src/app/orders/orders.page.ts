import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonButton,
  IonSpinner,
} from '@ionic/angular/standalone';
import { OrderService, Order } from '../services/order.service';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.page.html',
  styleUrls: ['./orders.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonContent,
    IonIcon,
    IonButton,
    IonSpinner,
  ],
})
export class OrdersPage implements OnInit {
  private orderService = inject(OrderService);
  private cartService = inject(CartService);
  private router = inject(Router);
  
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  activeTab: string = 'all';
  isLoading = true;
  
  tabs = [
    { id: 'all', label: 'Todos' },
    { id: 'completed', label: 'Completados' },
    { id: 'processing', label: 'En Curso' },
    { id: 'cancelled', label: 'Cancelados' },
  ];

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.isLoading = true;
    
    this.orderService.getLocalOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.filterOrders();
        this.isLoading = false;
      },
      error: () => {
        this.orders = [];
        this.filterOrders();
        this.isLoading = false;
      }
    });
  }

  setActiveTab(tabId: string) {
    this.activeTab = tabId;
    this.filterOrders();
  }

  filterOrders() {
    this.filteredOrders = this.orderService.getOrdersByStatus(this.orders, this.activeTab);
  }

  getStatusLabel(status: string): string {
    return this.orderService.getStatusLabel(status);
  }

  getStatusColor(status: string): string {
    return this.orderService.getStatusColor(status);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  reorderItems(order: Order) {
    order.line_items.forEach(item => {
      this.cartService.addProduct({
        id: item.product_id,
        name: item.name,
        price: item.price,
        images: item.image ? [{ src: item.image }] : []
      }, item.quantity);
    });
    this.router.navigate(['/cart']);
  }

  goBack() {
    this.router.navigate(['/profile']);
  }
}
