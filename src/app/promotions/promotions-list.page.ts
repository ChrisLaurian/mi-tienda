import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon, IonButton, IonModal } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, create, trash, close, arrowBack } from 'ionicons/icons';
import { PromotionsService, Promotion } from '../services/promotions.service';

@Component({
  selector: 'app-promotions-list',
  templateUrl: './promotions-list.page.html',
  styleUrls: ['./promotions-list.page.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink, IonContent, IonIcon, IonButton, IonModal],
})
export class PromotionsListPage implements OnInit {
  private promotionsService = inject(PromotionsService);
  
  promotions: Promotion[] = [];
  isLoading = true;
  showDeleteModal = false;
  promotionToDelete: Promotion | null = null;

  constructor() {
    addIcons({ add, create, trash, close, arrowBack });
  }

  ngOnInit() {
    this.loadPromotions();
  }

  loadPromotions() {
    this.isLoading = true;
    this.promotionsService.getPromotions().subscribe({
      next: (data) => {
        this.promotions = data;
        this.isLoading = false;
      },
      error: () => {
        this.promotions = [];
        this.isLoading = false;
      }
    });
  }

  confirmDelete(promotion: Promotion) {
    this.promotionToDelete = promotion;
    this.showDeleteModal = true;
  }

  cancelDelete() {
    this.promotionToDelete = null;
    this.showDeleteModal = false;
  }

  deletePromotion() {
    if (!this.promotionToDelete?.id) return;
    
    this.promotionsService.deletePromotion(this.promotionToDelete.id).subscribe({
      next: (success) => {
        if (success) {
          this.promotions = this.promotions.filter(p => p.id !== this.promotionToDelete?.id);
        }
        this.cancelDelete();
      }
    });
  }

  getStatus(promotion: Promotion): string {
    if (!promotion.active) return 'Inactiva';
    const now = new Date();
    const start = new Date(promotion.start_date);
    const end = new Date(promotion.end_date);
    
    if (now < start) return 'Programada';
    if (now > end) return 'Expirada';
    return 'Activa';
  }

  getStatusClass(promotion: Promotion): string {
    const status = this.getStatus(promotion);
    if (status === 'Activa') return 'status-active';
    if (status === 'Programada') return 'status-scheduled';
    if (status === 'Expirada') return 'status-expired';
    return 'status-inactive';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
