import { CpuService } from '../../system/cpu/cpu.service';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { PCB } from '../../system/pcb/pcb.model';
import { PcbService } from '../../system/pcb/pcb.service';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AlgorithmService } from '../../system/queue/algorithm.service';

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

  th{
    background-color: #e0f7fa; /* 表頭背景色 */
    color: #006064; /* 表頭文字顏色 */
    font-weight: bold;
    text-align: center;
  }
  
    p-table{
        --p-datatable-header-cell-padding: 5px; 
        --p-datatable-body-cell-padding: 5px; 
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
export class PcbComponent implements OnInit, OnDestroy {
    table: PCB[] = [];
    private subscriptions: Subscription[] = [];
    private pcbService = inject(PcbService)
    private algorithmService = inject(AlgorithmService); // 用於獲取演算法服務
    private cpuService = inject(CpuService); // 用於獲取核心時間服務

    //上一個核心時間的table深層快照
    private previousTable: any[] = [];


    toggleRowHighlight(row: any): void {

        //找到對應的行程資料
        const targetRow = this.table?.find((item) => item.pid == row.pid);
        if (targetRow) {
            // 如果行程狀態不是 Terminated，則更新行程狀態
            if (row.state == "Waiting") {
                // 將行程狀態設置為 Ready
                this.algorithmService.homelessPcb(targetRow, "Ready");
            } else {
                // 將行程狀態設置為 Waiting
                this.algorithmService.homelessPcb(targetRow, "Waiting");
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
        this.cpuService.getTimeAfterOneInstruction().subscribe((kernelTime) => {
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

    getOpenFilesArray(row: any): string {
        let ro = Array.from((row.openFiles as Map<string, any>).values());
        let resString = ""
        ro.forEach((file: any) => {
            if (file.type) {
                switch (row.state) {
                    case "Running":
                        //如果是Running狀態，則顯示type和Allocation
                        resString += `${file.type}(${file.Max}), `;
                        break;
                    case "Ready":
                        //如果是Ready狀態，則顯示type和Allocation
                        resString += `${file.type}(${file.Allocation}), `;
                        break;
                    case "Waiting":
                        //如果是Waiting狀態，則顯示type和Allocation
                        resString += `${file.type}(${file.Allocation}), `;
                        break;
                }
            } else {
                //否則只顯示ID
                resString += `${file.id}, `;
            }
        })
        return resString
    }
}