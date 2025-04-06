import { Component, inject } from '@angular/core';
import { PCB } from './pcb.model';
import { PcbService } from './pcb.service';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AlgorithmService } from '../../common/algorithm.service';

@Component({
  selector: 'app-pcb',
  standalone: true,
  imports: [FormsModule, TableModule, InputTextModule, CommonModule,TooltipModule],
  templateUrl: './pcb.component.html',
  styles: [`
  .table {
    width: 100%;
    left: 0px;
    top: 0px;
    right: 0px;
    bottom: 0px;
    position: absolute;
  }
  
  tr:nth-child(odd) {  
    background-color: #ffffff;/* 奇数行 */    
  }  

  tr:nth-child(even){  
    background-color:rgba(180, 218, 222, 0.32);  /* 偶数行 */
  }  

   :host {
    width:100%;
    height:100%;
    position: relative;  
    background-color: #f5f5f5;
    padding: 10px;
    border: 1px solid #ccc;
}
    `]
})
export class PcbComponent {
  table: PCB[] = [];
  private subscriptions: Subscription[] = [];
  private pcbService = inject(PcbService)
  private algorithmService = inject(AlgorithmService); // 用於獲取演算法服務

  toggleRowHighlight(row: any): void {

    //找到對應的行程資料
    const targetRow = this.table?.find((item) => item.pid == row.pid);
    if (targetRow) { 
      // 如果行程狀態不是 Terminated，則更新行程狀態
      if (row.state == "Waiting") {
        this.algorithmService.refreshQueue(targetRow, "Ready"); // 將行程狀態設置為 Ready
      } else {
        this.algorithmService.refreshQueue(targetRow, "Waiting"); // 將行程狀態設置為 Waiting
      }; // 更新行程狀態
    }
  }

  ngOnInit(): void {
    // 訂閱 Table 資料流
    this.subscriptions.push(
      this.pcbService.getTableStream().subscribe((data) => {
        this.table = data;
      })
    );
  }

  ngOnDestroy(): void {
    // 取消所有訂閱
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}