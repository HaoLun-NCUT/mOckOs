import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';

// 啟用 Angular 動畫(同步)
import { provideAnimations } from '@angular/platform-browser/animations';
// 啟用 Angular 動畫(非同步)
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

// 啟用 PrimeNG 全域設定
import { providePrimeNG } from 'primeng/config';

// 選擇 PrimeNG 主題
import Aura from '@primeng/themes/aura';
import Material from '@primeng/themes/material';


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Material,
        options: {
          //是否啟用暗黑模式
          darkModeSelector: false || 'none'
      }
      }
    })
  ]
};
