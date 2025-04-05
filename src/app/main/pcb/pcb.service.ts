import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PCB } from './pcb.model';
import { Process } from './pcb-process';

@Injectable({
  providedIn: 'root',
})
export class PcbService {
  // 行程資料表
  private table1: PCB[] = [];
  private table2: PCB[] = [];

  // 用於提供給 p-table 訂閱的資料流
  private table1Subject = new BehaviorSubject<PCB[]>([]);
  private table2Subject = new BehaviorSubject<PCB[]>([]);

  constructor() {
    // 初始化行程資料
    this.initializeTables();
  }

  /**
   * 初始化行程資料
   */
  private initializeTables(): void {
    // 將 pcb-process.ts 的資料轉換為 PCB 格式
    const processTable1: Process[] = [
      { pid: 'A', triggerTimestamp: 0, executionTime: 5 },
      { pid: 'B', triggerTimestamp: 2, executionTime: 7 },
      { pid: 'C', triggerTimestamp: 5, executionTime: 10 },
      { pid: 'D', triggerTimestamp: 7, executionTime: 8 },
      { pid: 'E', triggerTimestamp: 8, executionTime: 15 },
      { pid: 'F', triggerTimestamp: 12, executionTime: 25 },
      { pid: 'G', triggerTimestamp: 15, executionTime: 12 },
    ];

    const processTable2: Process[] = [
      { pid: 'A', triggerTimestamp: 0, executionTime: 4 },
      { pid: 'B', triggerTimestamp: 2, executionTime: 9 },
      { pid: 'C', triggerTimestamp: 5, executionTime: 6 },
      { pid: 'D', triggerTimestamp: 10, executionTime: 12 },
      { pid: 'E', triggerTimestamp: 15, executionTime: 20 },
    ];

    // 將 Process 轉換為 PCB
    this.table1 = processTable1.map((process, index) =>
      this.createPCBFromProcess(process, index + 1)
    );
    this.table2 = processTable2.map((process, index) =>
      this.createPCBFromProcess(process, index + 1)
    );

    // 更新資料流
    this.table1Subject.next(this.table1);
    this.table2Subject.next(this.table2);
  }

  /**
   * 將 Process 轉換為 PCB
   * @param process Process 資料
   * @param pid 行程 ID
   * @returns PCB 物件
   */
  private createPCBFromProcess(process: Process, pid: number): PCB {
    return new PCB(
      process.pid, // PID
      undefined,//Math.floor(Math.random() * 10) + 1, // 隨機優先級
      'New', // 初始狀態
      undefined, // 程式計數器
      [], // 暫存器
      1024, // 記憶體限制
      [], // 已開啟的檔案
      0, // 剩餘等待時間
      process.triggerTimestamp, // 觸發時間戳記
      false, // 是否為週期性行程
      process.executionTime, // 預估執行時間
      false // 是否啟用定時器
    );
  }

  /**
   * 獲取 Table1 的資料流
   * @returns Table1 的 Observable
   */
  getTable1Stream() {
    return this.table1Subject.asObservable();
  }

  /**
   * 獲取 Table2 的資料流
   * @returns Table2 的 Observable
   */
  getTable2Stream() {
    return this.table2Subject.asObservable();
  }
}
