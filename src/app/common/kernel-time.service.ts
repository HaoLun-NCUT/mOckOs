import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KernelTimeService {
  // 自定義的系統時間，初始為 0，每次更新時加 1
  private kernelTime = 0; // 用於存儲自定義系統時間

  private currentTime = new BehaviorSubject<number>(this.kernelTime); // 用於存儲當前時間的資料流
  
  private timerSubscription: Subscription | null = null; // 用於控制時間更新的訂閱

  private isRunning = false; // 用於標記是否正在運行

  constructor() {}

  // 啟動時間更新
  start(): void {
    if (this.isRunning) return; // 如果已經在運行，則不重複啟動
    this.isRunning = true;
    this.timerSubscription = interval(500).subscribe(() => {
      this.kernelTime++; // 每半秒自增 1
      this.currentTime.next(this.kernelTime); // 更新資料流
    });
  }

  // 暫停時間更新
  pause(): void {
    if (!this.isRunning) return; // 如果未運行，則不執行操作
    this.isRunning = false;
    this.timerSubscription?.unsubscribe(); // 停止訂閱
    this.timerSubscription = null;
  }

  // 終止時間更新並重置時間
  stop(): void {
    this.pause(); // 停止更新
    this.kernelTime = 0; // 重置自定義系統時間
    this.currentTime.next(this.kernelTime); // 重置資料流
  }

  // 獲取當前時間的資料流
  getTimeStream() {
    return this.currentTime.asObservable(); // 返回時間的 Observable
  }

  // 獲取當前的自定義系統時間
  getKernelTime(): number {
    return this.kernelTime;
  }
}
