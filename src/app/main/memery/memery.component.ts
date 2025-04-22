import { Component } from '@angular/core';
import { AlgorithmService } from '../../common/algorithm.service';
import { PCB } from '../pcb/pcb.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-memery',
  imports: [CommonModule],
  templateUrl: './memery.component.html',
  styles: [`
   :host {
    width: 100%;
    height: 100%;
  }`
  ]
})
export class MemeryComponent {
  readyQueue: PCB[] = [];
  waitingQueue: PCB[] = [];

  constructor(private algorithmService: AlgorithmService) {}

  ngOnInit(): void {
    // 將 AlgorithmService 中的佇列與執行空間綁定到本地屬性
    this.readyQueue = this.algorithmService.readyQueue;
    this.waitingQueue = this.algorithmService.waitingQueue;
  }
}