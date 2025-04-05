import { Component,inject } from '@angular/core';
import { Pcb } from './pcb.type';
import { PcbService } from './pcb.service';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pcb',
  standalone: true,
  imports: [FormsModule, TableModule, InputTextModule, CommonModule],
  templateUrl: './pcb.component.html',
})
export class PcbComponent {
  private pcbService = inject(PcbService);

  pcbs: Pcb[] = [];

  ngOnInit() {
    this.pcbs.push(...this.pcbService.getProductsMini())
  }
}
