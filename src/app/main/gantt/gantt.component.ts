import { KernelTimeService } from './../../common/kernel-time.service';
import { Component, inject, ViewChild } from '@angular/core';
import { ChartModule, UIChart } from 'primeng/chart';
import { Subscription } from 'rxjs';
import { PcbService } from '../pcb/pcb.service';
import { PCB } from '../pcb/pcb.model';

@Component({
  selector: 'app-gantt',
  imports: [ChartModule],
  templateUrl: './gantt.component.html',
  styles: [`
    :host {
      width: 100%;
      height: 100%;
      position: relative; // 使圖表能夠填滿父容器
    }
  `]
})
export class GanttComponent {
  @ViewChild(UIChart) chart!: UIChart; // 用於獲取圖表實例

  chartHeight = "100%"; // 圖表高度
  chartWidth = "100%"; // 圖表寬度

  chartData: any;
  chartOptions: any;

  private pcbSubscription!: Subscription;// 訂閱PCB資料流
  private kernelTimeSubscription!: Subscription;// 訂閱核心時間資料流

  private pcbService = inject(PcbService); // 用於獲取 PCB 資料流
  private kernelTimeService = inject(KernelTimeService); // 用於獲取 Kernel 時間資料流

  private pcbData!: PCB[]; // 訂閱取得的PCB 資料

  ngOnInit(): void {

    // 要傳入p-chart的資料結構
    this.chartData = {
      labels: [], // Y 軸標籤 (行程 PID)
      datasets: []
    };

    // 訂閱 PCB 資料流，發生時同步 Y 軸標籤
    this.pcbSubscription = this.pcbService.getTableStream().subscribe((pcbTable) => {
      console.log("PCB 資料流", pcbTable);
      this.pcbData = pcbTable; // 更新 PCB 資料
      this.chartData.labels = pcbTable.map((pcb) => {
        return pcb.pid
      }); // 使用行程的 PID 作為 Y 軸標籤

      console.log("Y 軸標籤", this.chartData.labels)
      this.chartData.datasets[0] = {
        data: [],
        borderColor: ['#000000'], // 邊框顏色
        borderWidth: [1] // 設置邊框寬度為 1px
      }

      // 手動觸發圖表更新
      this.chart?.refresh();
    });


    // 訂閱 Kernel 時間資料流，發生時新增bar
    this.kernelTimeSubscription = this.kernelTimeService.getTimeAfterOneInstruction().subscribe((kernelTime) => {
      // 遍歷 pcbData，找出 state 為 "running" 的 pid
      this.pcbData.forEach((pcb) => {
        if (pcb.state == "Running") {
          if (!Array.isArray(this.chartData.datasets[0].data)) {
            this.chartData.datasets[0].data = []; // 初始化為空陣列
          }
          // 在對應的 Y 軸位置新增一個 bar
          this.chartData.datasets[0].data.push({
            x: [kernelTime - 1, kernelTime], // X 軸範圍，從 kernelTime-1 到 kernelTime
            y: pcb.pid // Y 軸值應該是對應的 PID
          });
        }
      });

      // 手動觸發圖表更新
      this.chart?.refresh();
    });

    // 定義圖表的配置
    this.chartOptions = {
      indexAxis: 'y', // 將 XY 軸調換，設置為水平長條圖
      responsive: true,// 圖表RWD
      maintainAspectRatio: false, // 禁用默認的寬高比
      plugins: {
        legend: {
          position: 'none' // 圖例位置
        },
        tooltip: {
          enabled: true // 啟用提示
        }
      },
      animations: false, // 禁用動畫
      scales: {
        x: {
          beginAtZero: true, // X 軸從 0 開始
          min: 0, // 固定 X 軸的最小值為 0
          max: 90, // 固定 X 軸的最大值為 88
          grid: {
            drawTicks: true, // 繪製刻度
            drawBorder: true, // 繪製邊框
            color: '#e0e0e0', // 刻度線顏色
          },
          stacked: true,
          ticks: {
            stepSize: 1, // 刻度間隔
          }
        },
        y: {
          grid: {
            drawTicks: false, // 不繪製 Y 軸刻度
          },
          ticks: {
            font: {
              size: 30 // 設置字體大小為 16px
            }
          }
        }
      }
    };

  }




  ngOnDestroy(): void {
    // 取消訂閱以防止記憶體洩漏
    this.pcbSubscription.unsubscribe();
    this.kernelTimeSubscription.unsubscribe();
  }
}