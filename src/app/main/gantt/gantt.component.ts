import { KernelTimeService } from './../../common/kernel-time.service';
import { Component, inject, ViewChild } from '@angular/core';
import { ChartModule, UIChart } from 'primeng/chart';
import { Subscription } from 'rxjs';
import { PcbService } from '../pcb/pcb.service';
import { PCB } from '../pcb/pcb.model';
import zoomPlugin from 'chartjs-plugin-zoom';
import { Chart } from 'chart.js';

// 註冊chart插件
Chart.register(zoomPlugin);

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
  @ViewChild('chart') chart!: UIChart; // 用於獲取圖表實例

  chartHeight = "100%"; // 圖表高度
  chartWidth = "100%"; // 圖表寬度

  chartData = {
    labels: [] as any[], // Y 軸標籤 (行程 PID)
    datasets: [] as any[]
  };
  chartOptions: any

  lastMax = 100; // 用於平移的 X 軸值
  lastMin = 0; // 用於平移的 X 軸值

  private pcbSubscription!: Subscription;// 訂閱PCB資料流
  private kernelTimeSubscription!: Subscription;// 訂閱核心時間資料流

  private pcbService = inject(PcbService); // 用於獲取 PCB 資料流
  private kernelTimeService = inject(KernelTimeService); // 用於獲取 Kernel 時間資料流
  private kernelTime!: number; // Kernel 時間

  private pcbData!: PCB[]; // 訂閱取得的PCB 資料

  ngOnInit(): void {

    // 訂閱 PCB 資料流，發生時同步 Y 軸標籤
    this.pcbSubscription = this.pcbService.getTableStream().subscribe((pcbTable) => {
      this.pcbData = pcbTable; // 更新 PCB 資料

      this.chartData.labels = pcbTable.map((pcb) => pcb.pid);; // 清空 Y 軸標籤

      this.chartData.datasets[0] = {
        data: [],
        borderColor: 'rgb(31, 49, 0)', // 邊框顏色
        borderWidth: 3, // 設置邊框寬度為 1px
        backgroundColor:'rgba(199, 255, 103, 0.67)', // 背景顏色
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
            x: [kernelTime, kernelTime + 1], // X 軸範圍，從 kernelTime-1 到 kernelTime
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
      plugins: {
        legend: {
          position: 'none' // 圖例位置
        },
        tooltip: {
          enabled: true // 啟用提示
        },
        zoom: {
          limits: {
            x: { min: 0, minRange: 10 }, // X 軸的最小值和最大值
          },
          pan: {
            enabled: true, // 啟用平移
            mode: 'x', // 僅允許在 X 軸方向平移
            threshold: 20, // 平移的靈敏度
            speed: 1000,
            onPan: ({ chart }: any) => {
              const xScale = chart.scales.x;
              const max = xScale.max;
              const min = xScale.min;

              // 強制對齊到整數
              const alignedMax = max < this.lastMax ? Math.floor(max) : Math.ceil(max); // 將 max 向上取整
              const alignedMin = min < this.lastMin ? Math.floor(min) : Math.ceil(min); // 將 min 向上取整

              this.lastMax = alignedMax; // 更新 lastMax
              this.lastMin = alignedMin; // 更新 lastMin

              // 限制最小值為 0
              if (alignedMin < 0) {
                xScale.options.min = 0;
                this.lastMin = 0; // 更新 lastMin
              } else {
                xScale.options.min = alignedMin;
                xScale.options.max = alignedMax;
              }

              chart.update('none'); // 更新圖表但禁用動畫
            },
          },
          zoom: {
            threshold: 10, // 滾輪縮放的靈敏度
            wheel: {
              enabled: true // 允許滾輪縮放（可選）
            },
            pinch: {
              enabled: false // 禁用觸控縮放（可選）
            },
            mode: 'x', // 僅允許在 X 軸方向縮放
            onZoom: ({ chart }: any) => {
              const xScale = chart.scales.x;
              const max = xScale.max;
              const min = xScale.min;
            
              // 強制對齊到整數
              const alignedMax = max < this.lastMax ? Math.floor(max) : Math.ceil(max); // 將 max 向上取整
              const alignedMin = min < this.lastMin ? Math.floor(min) : Math.ceil(min); // 將 min 向上取整
            
              this.lastMax = alignedMax; // 更新 lastMax
              this.lastMin = alignedMin; // 更新 lastMin

              // 限制最小值為 0
              if (alignedMin < 0) {
                xScale.options.min = 0;
                xScale.options.max = 30;
              } else {
                xScale.options.min = alignedMin;
                xScale.options.max = alignedMax;
              }
            
              chart.update('none'); // 更新圖表但禁用動畫
            }
          }
        }
      },
      animations: false, // 禁用動畫
      scales: {
        x: {
          min: 0, // 固定 X 軸的最小值為 0
          max: 100, // 固定 X 軸的最大值為 88
          grid: {
            drawTicks: true, // 繪製刻度
            drawBorder: true, // 繪製邊框
            color: 'gray', // 刻度線顏色
          },
          ticks: {
            stepSize: 1, // 刻度間隔
          }
        },
        y: {
          grid: {
            drawTicks: true, // 繪製刻度
            drawBorder: true, // 繪製邊框
            color: 'gray', // 刻度線顏色
          },
          color: 'rgba(0, 0, 0, 0)', // 刻度線顏色
          backgroundColor: 'rgb(226, 240, 246)', // 刻度線顏色
          ticks: {
            color: 'black',
            font: {
              size: 30, // 設置字體大小為 16px
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
