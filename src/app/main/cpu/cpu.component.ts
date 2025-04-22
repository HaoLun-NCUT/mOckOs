import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { KernelTimeService } from '../../common/kernel-time.service';
import { AlgorithmService } from '../../common/algorithm.service';
import { Subscription } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { PCB } from '../pcb/pcb.model';
import { PcbService } from '../pcb/pcb.service';
import { CommonModule } from '@angular/common';
import { SliderModule, SliderChangeEvent } from 'primeng/slider';

@Component({
  selector: 'app-cpu',
  imports: [FormsModule, ButtonModule, DropdownModule, CommonModule, SliderModule],
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
  private kernelTimeService = inject(KernelTimeService);
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
    this.timeSubscription = this.kernelTimeService.getTimeStream().subscribe(time => {
      this.kernelTime = time; // 更新核心時間
      this.selectedAlgorithm.value(this.processes, time) // 每次核心時間更新時，重新使用選定的演算法計算結果
      this.kernelTimeService.timeCallback.next(time); // 發送當前時間
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
    this.kernelTimeService.start();
  }

  // 暫停核心時間
  pauseKernelTime(): void {
    this.kernelTimeService.pause();
  }

  // 重置核心時間
  stopKernelTime(): void {
    this.kernelTimeService.stop();
    this.algorithmService.cleanQuere(); // 清除排程
    this.pcbService.initializeTables(); // 初始化行程資料
  }

  // splider調整核心數量
  onCoresChange(event: SliderChangeEvent) {
    event.value ? this.algorithmService.setMaxCore(event.value) : ""
  }
}