import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import {
  IonContent,
  IonIcon,
  AlertController,
} from '@ionic/angular/standalone';

interface Order {
  id: number;
  name: string;
  image: string;
  date: string;
  status: string;
  price: number;
  items: number;
  statusType: 'active' | 'completed' | 'cancelled';
}

@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonContent,
    IonIcon,
  ],
})
export class CartPage implements OnInit {
  private router = inject(Router);
  private alertController = inject(AlertController);

  selectedTab: 'active' | 'completed' | 'cancelled' = 'completed';

  activeOrders: Order[] = [
    {
      id: 1,
      name: 'Hawaiian Pizza',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&h=200&fit=crop',
      date: '2 Dic, 02:30 pm',
      status: 'En camino',
      price: 45.00,
      items: 3,
      statusType: 'active'
    },
    {
      id: 2,
      name: 'Caesar Salad',
      image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=200&h=200&fit=crop',
      date: '2 Dic, 01:15 pm',
      status: 'Preparando',
      price: 18.50,
      items: 1,
      statusType: 'active'
    }
  ];

  completedOrders: Order[] = [
    {
      id: 3,
      name: 'Chicken Curry',
      image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=200&h=200&fit=crop',
      date: '29 Nov, 01:20 pm',
      status: 'Pedido entregado',
      price: 50.00,
      items: 2,
      statusType: 'completed'
    },
    {
      id: 4,
      name: 'Bean and Vegetable Burger',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop',
      date: '13 Nov, 06:05 pm',
      status: 'Pedido entregado',
      price: 50.00,
      items: 2,
      statusType: 'completed'
    },
    {
      id: 5,
      name: 'Coffee Latte',
      image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=200&h=200&fit=crop',
      date: '10 Nov, 08:30 am',
      status: 'Pedido entregado',
      price: 8.00,
      items: 1,
      statusType: 'completed'
    },
    {
      id: 6,
      name: 'Strawberry Cheesecake',
      image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=200&h=200&fit=crop',
      date: '03 Oct, 03:40 pm',
      status: 'Pedido entregado',
      price: 22.00,
      items: 2,
      statusType: 'completed'
    }
  ];

  cancelledOrders: Order[] = [
    {
      id: 7,
      name: 'Margherita Pizza',
      image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=200&h=200&fit=crop',
      date: '01 Nov, 12:00 pm',
      status: 'Cancelado',
      price: 28.00,
      items: 1,
      statusType: 'cancelled'
    }
  ];

  ngOnInit() {}

  goBack() {
    this.router.navigate(['/store']);
  }

  selectTab(tab: 'active' | 'completed' | 'cancelled') {
    this.selectedTab = tab;
  }

  async leaveReview(order: Order) {
    const alert = await this.alertController.create({
      header: 'Dejar Reseña',
      message: `¿Cómo fue tu experiencia con ${order.name}?`,
      inputs: [
        {
          name: 'rating',
          type: 'number',
          min: 1,
          max: 5,
          placeholder: 'Calificación (1-5)',
        },
        {
          name: 'comment',
          type: 'textarea',
          placeholder: 'Tu comentario...',
        },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Enviar',
          handler: (data) => {
            if (data.rating && data.comment) {
              this.showMessage('¡Gracias por tu reseña!');
            }
          },
        },
      ],
    });
    await alert.present();
  }

  orderAgain(order: Order) {
    this.router.navigate(['/store']);
  }

  async showMessage(message: string) {
    const alert = await this.alertController.create({
      header: 'Información',
      message: message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}