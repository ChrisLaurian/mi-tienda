import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonInput, IonSelect, IonSelectOption, IonDatetime, IonButton, IonToggle, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBack, checkmark, search, close, pricetag, calendar, cash, cart } from 'ionicons/icons';
import { PromotionsService, Promotion } from '../services/promotions.service';

@Component({
  selector: 'app-promotion-form',
  templateUrl: './promotion-form.page.html',
  styleUrls: ['./promotion-form.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonInput, IonSelect, IonSelectOption, IonDatetime, IonButton, IonToggle, IonIcon],
})
export class PromotionFormPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private promotionsService = inject(PromotionsService);
  
  isEditing = false;
  promotionId: number | null = null;
  isLoading = false;
  isSaving = false;
  
  products: any[] = [];
  categories: any[] = [];
  
  promotion: Promotion = {
    title: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 0,
    start_date: '',
    end_date: '',
    active: true,
    product_ids: [],
    category_ids: []
  };

  constructor() {
    addIcons({ arrowBack, checkmark, search, close, pricetag, calendar, cash, cart });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id && id !== 'new') {
        this.isEditing = true;
        this.promotionId = Number(id);
        this.loadPromotion();
      }
    });
    
    this.loadProductsAndCategories();
  }

  loadProductsAndCategories() {
    this.promotionsService.getProducts().subscribe({
      next: (data) => this.products = data
    });
    
    this.promotionsService.getCategories().subscribe({
      next: (data) => this.categories = data
    });
  }

  loadPromotion() {
    if (!this.promotionId) return;
    
    this.isLoading = true;
    this.promotionsService.getPromotion(this.promotionId).subscribe({
      next: (data) => {
        if (data) {
          this.promotion = data;
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  save() {
    this.isSaving = true;
    
    this.promotionsService.savePromotionLocal(this.promotion, this.isEditing && this.promotionId ? this.promotionId : null).subscribe({
      next: () => {
        this.isSaving = false;
        this.router.navigate(['/promotions']);
      },
      error: () => {
        this.isSaving = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/promotions']);
  }

  onDateChange(field: 'start_date' | 'end_date', value: string) {
    if (value) {
      this.promotion[field] = new Date(value).toISOString();
    }
  }

  toggleProduct(productId: number) {
    if (!this.promotion.product_ids) {
      this.promotion.product_ids = [];
    }
    const index = this.promotion.product_ids.indexOf(productId);
    if (index > -1) {
      this.promotion.product_ids.splice(index, 1);
    } else {
      this.promotion.product_ids.push(productId);
    }
  }

  toggleCategory(categoryId: number) {
    if (!this.promotion.category_ids) {
      this.promotion.category_ids = [];
    }
    const index = this.promotion.category_ids.indexOf(categoryId);
    if (index > -1) {
      this.promotion.category_ids.splice(index, 1);
    } else {
      this.promotion.category_ids.push(categoryId);
    }
  }
}
