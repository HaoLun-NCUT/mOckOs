import { min } from 'rxjs';
import { Injectable } from '@angular/core';
import { PCB } from '../main/pcb/pcb.model';

@Injectable({
  providedIn: 'root',
})
export class AlgorithmService {
  readyQueue: PCB[] = []; // 備妥佇列
  waitingQueue: PCB[] = []; // 等待佇列
  runningSpace: PCB[] = []; // 執行空間
  maxCore: number = 3;//最大執行數量

  /**
   *演算法選項
   */
  algorithmOptions = [
    { label: '最短行程優先 (SPN/SJF)不搶佔', value: (processes: PCB[], kernelTime: number) => this.sjf_fcfs(processes, kernelTime) },
    { label: '最短行程優先 (SPN/SJF)搶佔', value: (processes: PCB[], kernelTime: number) => this.sjf_occupy(processes, kernelTime) },
    { label: '先到先服務 (FCFS)', value: (processes: PCB[], kernelTime: number) => this.fcfs(processes, kernelTime) },
    { label: '依序循環 (RR)', value: (processes: PCB[], kernelTime: number) => this.roundRobin(processes, 3, kernelTime) },
    { label: '最短剩餘時間 (SRT)搶佔', value: (processes: PCB[], kernelTime: number) => this.srt(processes, kernelTime) },
  ];


  /**清空佇列 */
  cleanQuere() {
    this.readyQueue.splice(0, this.readyQueue.length); // 清空備妥佇列
    this.waitingQueue.splice(0, this.waitingQueue.length); // 清空等待佇列
    this.runningSpace.splice(0, this.runningSpace.length); // 清空執行空間
  }

  /**佇列刷新服務 */
  refreshQueue(p: PCB, tobe: string): void {
    if (p.state == tobe) {
      return;// 如果行程狀態已經是目標狀態，則不進行任何操作
    }

    const oldState = p.state; // 儲存舊狀態

    switch (tobe) {
      case 'Ready':
        p.moveToReady(); // 將行程狀態設置為 Ready
        this.readyQueue.push(p); // 將行程加入備妥佇列
        break;
      case 'Waiting':
        p.moveToWaiting(); // 將行程狀態設置為 Waiting
        this.waitingQueue.push(p); // 將行程加入等待佇列
        break;
      case 'Running':
        p.moveToRunning(); // 將行程狀態設置為 Running
        this.runningSpace.push(p); // 將行程加入執行中行程
        break;
      case 'Terminated':
        p.moveToTerminated(); // 將行程狀態設置為 Terminated
        break;
    }
    switch (oldState) {
      case 'Ready':
        let index_ready = this.readyQueue.findIndex((process) => process.pid == p.pid); // 找到行程在備妥佇列中的索引
        this.readyQueue.splice(index_ready, 1); // 從備妥佇列中移除行程
        break;
      case 'Waiting':
        let index_wait = this.waitingQueue.findIndex((process) => process.pid == p.pid); // 找到行程在等待佇列中的索引
        this.waitingQueue.splice(index_wait, 1); // 從等待佇列中移除行程
        break;
      case 'Running':
        let index_run = this.runningSpace.findIndex((process) => process.pid == p.pid); // 找到行程在執行中行程中的索引
        this.runningSpace[index_run].cleanRunningTime();//執行時間歸零
        this.runningSpace.splice(index_run, 1); // 從執行中行程中移除行程
        break;
    }
  }

  /** PCB狀態刷新服務*/
  refreshState(processes: PCB[], kernelTime: number, errorEven?: any): PCB[] {
    const result = processes.map((process) => {
      if (process.state === 'Terminated') {
        return process;// 已終止的行程不動作
      }

      if (process.remainingTime === 0) {
        this.refreshQueue(process, 'Terminated'); //佇列更新
        return process;//視為已終止的行程，不再動作
      }

      if (process.state === 'Running') {
        return process; // 如果行程狀態為 Running，則不進行任何操作
      }

      if (process.triggerTimestamp <= kernelTime && process.isTimerActive) {
        this.refreshQueue(process, 'Ready'); //佇列更新
        process.isTimerActive = false; // 取消定時器
      } else if (process.isTimerActive) {
        this.refreshQueue(process, 'Waiting'); //佇列更新
      };
      return process; // 返回行程資料
    })

    return result;
  }

  /**
   * 將備妥佇列中的行程迴圈移入執行空間
   */
  toRuning() {
    //檢查執行空間是否為空，且備妥佇列中有行程
    while (this.runningSpace.length < this.maxCore && this.readyQueue.length > 0) {
      //將備妥佇列中的第一個行程移入執行空間
      this.refreshQueue(this.readyQueue[0], 'Running'); //將備妥佇列中的第一個行程移入執行空間
    }
  }

  /**
   * 正在執行中業務邏輯
   */
  running() {
    this.runningSpace.forEach(process => { process.updateRemainingTime(1) }); // 更新剩餘時間
  }

  /**
   * 1️⃣ 先到先服務（FCFS）
   * @param processes 行程列表
   * @returns 排序後的行程列表
   */
  fcfs(processes: PCB[], kernelTime: number): void {
    this.refreshState(processes, kernelTime);
    this.toRuning()//短程排班(備妥=>執行)
    this.running();//執行中業務邏輯
  }

  /**
   * 2️⃣ 依序循環（RR - Round-Robin）
   * @param processes 行程列表
   * @param timeQuantum 時間片大小
   * @returns 模擬執行的順序
   */
  roundRobin(processes: PCB[], timeQuantum: number, kernelTime: number): void {
    this.refreshState(processes, kernelTime);
    //遍歷執行空間中的行程，如果執行時間大於等於時間片，則將行程移出執行空間，並加入備妥佇列
    this.runningSpace.forEach(process => {
      if (process.rungingTime >= timeQuantum) {
        this.refreshQueue(this.runningSpace[0], 'Ready'); //將行程移出執行空間，並加入備妥佇列
      }
    })
    this.toRuning()//短程排班(備妥=>執行)
    this.running();//執行中業務邏輯
  }

  /**
   * 3️⃣ 最短剩餘時間（SRT - Shortest Remaining Time）
   * @param processes 行程列表
   * @returns 模擬執行的順序
   */
  srt(processes: PCB[], kernelTime: number): void {
    this.refreshState(processes, kernelTime);
    this.readyQueue.sort((a, b) => a.remainingTime - b.remainingTime); // 將備妥佇列按預估執行時間排序
    this.toRuning()//短程排班(備妥=>執行)
    if (this.runningSpace.length > 0 && this.readyQueue.length > 0) {//搶占機制
      if (this.runningSpace[0].remainingTime > this.readyQueue[0].remainingTime) {
        this.refreshQueue(this.runningSpace[0], 'Ready'); // 將執行空間中的行程移入備妥佇列
        this.refreshQueue(this.readyQueue[0], 'Running'); // 將備妥佇列中的第一個行程移入執行空間
      }
    }
    this.running();//執行中業務邏輯
  }

  /**
  * 4️⃣ 最短行程優先（SPN/SJF - Shortest Process Next /Shortest Job First）
  * @description 這個演算法會選擇預估執行時間最短的行程來執行，允許搶佔。
  * @param processes 行程列表
  * @returns 排序後的行程列表
  */
  sjf_occupy(processes: PCB[], kernelTime: number): void {
    this.refreshState(processes, kernelTime);
    this.readyQueue.sort((a, b) => a.executionTime - b.executionTime); // 將備妥佇列按預估執行時間排序
    this.toRuning()//短程排班(備妥=>執行)
    if (this.runningSpace.length > 0 && this.readyQueue.length > 0) {//這是搶佔機制的情況
      if (this.runningSpace[0].executionTime > this.readyQueue[0].executionTime) {
        this.refreshQueue(this.runningSpace[0], 'Ready'); // 將執行空間中的行程移入備妥佇列
        this.refreshQueue(this.readyQueue[0], 'Running'); // 將備妥佇列中的第一個行程移入執行空間
      }
    }
    this.running();//執行中業務邏輯
  }

  /**
  * 5️⃣ 最短行程優先（SPN/SJF - Shortest Process Next /Shortest Job First）
  * @description 這個演算法會選擇預估執行時間最短的行程來執行，不允許搶佔。
  * @param processes 行程列表
  * @returns 排序後的行程列表
  */
  sjf_fcfs(processes: PCB[], kernelTime: number): void {
    const newpcb = this.refreshState(processes, kernelTime);
    this.readyQueue.sort((a, b) => a.executionTime - b.executionTime); // 將備妥佇列按預估執行時間排序

    this.toRuning()//短程排班(備妥=>執行)
    this.running();//執行中業務邏輯
  }

  /**
   * 設定核心數量
   */
  setMaxCore(core: number) {
    this.maxCore = core;
  }
}
