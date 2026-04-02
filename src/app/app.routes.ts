import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'store',
    loadComponent: () => import('./store/store.page').then((m) => m.StorePage),
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'set-password',
    loadComponent: () => import('./set-password/set-password.page').then((m) => m.SetPasswordPage),
  },
  {
    path: 'payment',
    loadComponent: () => import('./payment/payment.page').then((m) => m.PaymentPage),
  },
  {
    path: 'product/:id',
    loadComponent: () => import('./product-detail/product-detail.page').then((m) => m.ProductDetailPage),
  },
  {
    path: 'cart',
    loadComponent: () => import('./cart/cart.page').then((m) => m.CartPage),
  },
  {
    path: 'checkout',
    loadComponent: () => import('./checkout/checkout.page').then((m) => m.CheckoutPage),
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile.page').then((m) => m.ProfilePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
