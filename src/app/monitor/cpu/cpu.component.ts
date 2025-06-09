import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CpuService } from '../../system/cpu/cpu.service';
import { AlgorithmService } from '../../system/queue/algorithm.service';
import { Subscription } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { PCB } from '../../system/pcb/pcb.model';
import { PcbService } from '../../system/pcb/pcb.service';
import { CommonModule } from '@angular/common';
import { SliderModule, SliderChangeEvent } from 'primeng/slider';
import { CardModule } from 'primeng/card';

@Component({
    selector: 'app-cpu',
    imports:
        [
            CardModule,
            FormsModule,
            ButtonModule,
            DropdownModule,
            CommonModule,
            SliderModule
        ],
    templateUrl: './cpu.component.html',
    styles: [`
  :host {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    // justify-content: center;
  }
    p-card {
        margin: 0.2px ;
        --p-card-title-font-size: 1rem;
        --p-card-color:rgb(12, 65, 0);
        --p-card-body-gap: 0px;
        --p-card-body-padding: 0px;
        --p-card-caption-gap: 20px;
    }

  .cpu-controls {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
  }

  .kernel-time-display {
    font-size: 1.5rem;
    font-weight: bold;
  }
  `]
})
export class CpuComponent implements OnInit, OnDestroy {
    private cpuService = inject(CpuService);
    public algorithmService = inject(AlgorithmService);
    private pcbService = inject(PcbService);

    cores: number = 1 //用於儲存slider核心數量
    kernelTime: number = 0; // 用於存儲核心時間
    private timeSubscription!: Subscription; // 用於訂閱核心時間的資料流
    private pcbSubscription!: Subscription; // 用於訂閱 PCB 資料流

    selectedAlgorithm: any | null = this.algorithmService.algorithmOptions[0];// 選定下拉選單的選項
    processes: PCB[] = []; // 從 PcbService 獲取的行程資料

    ngOnInit(): void {
        // 訂閱核心時間資料流
        this.timeSubscription = this.cpuService.getTimeStream().subscribe(time => {
            this.kernelTime = time; // 更新核心時間
            this.selectedAlgorithm.value(time) // 每次核心時間更新時，重新使用選定的演算法計算結果
            this.cpuService.timeCallback.next(time); // 發送當前時間
        });

        // 訂閱 PCB 資料流
        this.pcbSubscription = this.pcbService.getTableStream().subscribe(data => {
            this.processes = data; // 獲取行程資料
        });
    }

    ngOnDestroy(): void {
        // 取消訂閱以防止記憶體洩漏
        this.timeSubscription.unsubscribe();
        this.pcbSubscription.unsubscribe();
    }

    // 啟動核心時間
    startKernelTime(): void {
        this.cpuService.start();
    }

    // 暫停核心時間
    pauseKernelTime(): void {
        this.cpuService.pause();
    }

    // 重置核心時間
    stopKernelTime(): void {
        this.cpuService.stop();
        this.algorithmService.cleanQuere(); // 清除排程
        this.pcbService.initializeTables(); // 初始化行程資料
    }

    // splider調整核心數量
    onCoresChange(event: SliderChangeEvent) {
        event.value ? this.algorithmService.setMaxCore(event.value) : ""
    }
}