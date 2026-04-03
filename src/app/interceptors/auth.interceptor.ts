import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('access_token');
  
  // No adjuntar el token si estamos intentando loguearnos
  if (req.url.includes('jwt-auth/v1/token')) {
    return next(req);
  }
  
  // No adjuntar el token si es una petición a WooCommerce API (usa consumer_key/secret)
  if (req.url.includes('/wc/v3/')) {
    return next(req);
  }
  
  // No adjuntar el token si es una petición a WooCommerce Store API (público)
  if (req.url.includes('/wc/store/')) {
    return next(req);
  }
  
  // No adjuntar el token para admin-ajax (registro)
  if (req.url.includes('admin-ajax.php')) {
    return next(req);
  }
  
  // Solo adjuntar token a otras peticiones autenticadas
  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }
  
  return next(req);
};
