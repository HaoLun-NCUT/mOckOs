import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PCB } from './pcb.model';
import { Process, processTables } from './pcb-process';

@Injectable({
  providedIn: 'root',
})
export class PcbService {
  // 行程資料表
  private table: PCB[] = [];

  // 用於提供給 p-table 訂閱的資料流
  private tableSubject = new BehaviorSubject<PCB[]>([]);

  //當前選取的 PCB 表序號
  public  currentTable: number = 0;

  constructor() {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.initializeTables();
  }

  /**
   * 初始化行程資料
   */
  initializeTables(): void {
    // 將 Process 轉換為 PCB
    this.table = processTables[this.currentTable].map((process, index) =>
      this.createPCBFromProcess(process, index + 1)
    );

    // 更新資料流
    this.tableSubject.next(this.table);
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
      process.executionTime,// 剩餘時間
      process.triggerTimestamp, // 觸發時間戳記
      false, // 是否為週期性行程
      process.executionTime, // 預估執行時間
      true // 是否啟用定時器
    );
  }

  /**
   * 獲取 Table的資料流
   * @returns Table的 Observable
   */
  getTableStream() {
    return this.tableSubject.asObservable();
  }
}
