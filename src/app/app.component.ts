import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { PushService } from './services/push.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  private pushService = inject(PushService);
  private themeService = inject(ThemeService);

  constructor() {
    void this.pushService.init();
    this.themeService.init();
  }
}
