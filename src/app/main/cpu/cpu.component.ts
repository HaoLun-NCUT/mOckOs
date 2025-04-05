import { Component, OnInit, OnDestroy } from '@angular/core';
import { KernelTimeService } from '../../common/kernel-time.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-cpu',
  templateUrl: './cpu.component.html',
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
export class CpuComponent implements OnInit, OnDestroy {
  kernelTime: number = 0; // 用於存儲核心時間
  private timeSubscription!: Subscription; // 用於訂閱核心時間的資料流

  constructor(private kernelTimeService: KernelTimeService) { }

  ngOnInit(): void {
    // 訂閱核心時間資料流
    this.timeSubscription = this.kernelTimeService.getTimeStream().subscribe(time => {
      this.kernelTime = time; // 更新核心時間
    });
  }

  ngOnDestroy(): void {
    // 取消訂閱以防止記憶體洩漏
    this.timeSubscription.unsubscribe();
  }
}
