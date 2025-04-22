import { KernelTimeService } from './../../common/kernel-time.service';
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
  imports: [FormsModule, TableModule, InputTextModule, CommonModule, TooltipModule],
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

    @keyframes flashColor {
  0% {
    background-color: rgba(159, 224, 29, 0.59);
  }
  100% {
    background-color: transparent;
  }
}

.flash-red {
  animation: flashColor 0.5s ease-out;
}
}
    `]
})
export class PcbComponent {
  table: PCB[] = [];
  private subscriptions: Subscription[] = [];
  private pcbService = inject(PcbService)
  private algorithmService = inject(AlgorithmService); // 用於獲取演算法服務
  private KernelTimeService = inject(KernelTimeService); // 用於獲取核心時間服務

  //上一個核心時間的table深層快照
  private previousTable: any[] = [];


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


  triggerFlash(row: any, field: string): void {
    const flashField = `flash${field.charAt(0).toUpperCase() + field.slice(1)}`;
    row[flashField] = true;
    setTimeout(() => {
      row[flashField] = false;
    }, 150); // 0.5秒後移除閃爍效果
  }


  ngOnInit(): void {
    //訂閱核心時間資料流(主要用於每秒的特效觸發，並不承擔更新Table的責任)
    this.KernelTimeService.getTimeAfterOneInstruction().subscribe((kernelTime) => {
      // 遍歷 table，檢查每一行的狀態是否有變化
      this.previousTable.forEach((newRow, index) => {
        const oldRow = this.table[index];
        if (newRow && oldRow) {
          for (const key in newRow) {
            if (newRow[key as keyof PCB] !== oldRow[key as keyof PCB]) {
              this.triggerFlash(oldRow, key); // 觸發閃爍效果
            }
          }
        }
      });
      this.previousTable = this.deepCopyArray(this.table); // 深層複製當前的table資料
    });

    // 訂閱 Table 資料流
    this.subscriptions.push(
      this.pcbService.getTableStream().subscribe((data) => {
        this.table = data;
        this.previousTable = this.deepCopyArray(this.table); // 深層複製當前的table資料
      })
    );
  }

  ngOnDestroy(): void {
    // 取消所有訂閱
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  //對PCB[]進行深層複製
  deepCopyArray(array: PCB[]): any[] {
    return array.map(item => ({ ...item }));
  }
}