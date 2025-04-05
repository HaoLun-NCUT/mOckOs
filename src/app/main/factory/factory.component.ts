import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { ButtonModule } from 'primeng/button';
@Component({
  selector: 'app-factory',
  imports: [FormsModule, MultiSelectModule, ButtonModule],
  templateUrl: './factory.component.html',
  styles: [`
   :host {
    width: 100%;
    height: 100%;
    background: url('public/work-in-progress.png') no-repeat center center; /* 背景圖片 */
    background-size: auto 50%; /* 縮小背景圖片 */
    background-blend-mode: multiply; /* 混合模式，讓圖片與半透明背景結合 */
    filter: opacity(50%); /* 設置圖片透明度為 50% */
  }`
  ]
})
export class FactoryComponent {
  countries: any[] = [
    { name: 'USA', code: 'US' },
    { name: 'Germany', code: 'DE' },
    { name: 'Italy', code: 'IT' },
    { name: 'Spain', code: 'ES' },
    { name: 'France', code: 'FR' },
    { name: 'United Kingdom', code: 'GB' },
    { name: 'China', code: 'CN' },
    { name: 'Japan', code: 'JP' },
    { name: 'India', code: 'IN' },
    { name: 'Brazil', code: 'BR' }
  ];

  selectedCountries: any[] = [];
  selectedCountry: any = null;

  
}
