import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { MenuController } from '@ionic/angular';
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
  private menuController = inject(MenuController);

  constructor() {
    void this.pushService.init();
    this.themeService.init();
    this.menuController.enable(true, 'main-menu');
  }
}
