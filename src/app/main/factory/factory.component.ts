import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { ButtonModule } from 'primeng/button';
@Component({
  selector: 'app-factory',
  imports: [FormsModule, MultiSelectModule, ButtonModule],
  templateUrl: './factory.component.html',
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
