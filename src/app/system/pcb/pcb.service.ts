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

    //用於提供readyQueue的資料流
    private readyQueueSubject = new BehaviorSubject<{ title: string, max_length: number }[]>([]);

    //基礎資源資料流
    private resourceSubject = new BehaviorSubject<any[]>([]);

    //當前選取的 PCB 表序號
    public currentTable: number = 0;

    constructor() {
        this.initializeTables();
    }

    /**
     * 初始化行程資料
     */
    initializeTables(): void {
        let ps = processTables[this.currentTable].makePs();
        this.table = ps.map((process: any, index: any) =>
            this.createPCBFromProcess(process, index + 1))

        // 更新資料流
        this.tableSubject.next(this.table);
        this.readyQueueSubject.next(processTables[this.currentTable].readyQueues);
        this.resourceSubject.next(processTables[this.currentTable].baseResources || []);
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
            process.priority ?? 0,// 優先級
            'New', // 初始狀態
            undefined, // 程式計數器
            [], // 暫存器
            1024, // 記憶體限制
            new Map<string, any>(), // 已開啟的檔案
            process.index_q ?? 0,//使用的佇列序號
            process.resource ? new Map(process.resource().map(process => [process.id, process])) : new Map(), // 資源列表
            process.doneOne,
            process.ready_to_running_Check, // 備妥到執行檢查函式
            process.waiting_to_ready_Check, // 等待到備妥檢查函式
            process.executionTime,// 剩餘時間
            process.triggerTimestamp, // 觸發時間戳記
            process.isPeriodicTask ?? false, // 是否為週期性行程
            process.executionTime, // 預估執行時間
            process.isTimerActive ?? true, // 是否啟用定時器
            process.triggerSetter, // 觸發設定函式
        );
    }

    /**
     * 獲取 Table的資料流
     * @returns Table的 Observable
     */
    getTableStream() {
        return this.tableSubject.asObservable();
    }

    /**
     * 獲取 Ready Queue 的資料流
     * @returns Ready Queue 的 Observable
     */
    getReadyQueueStream() {
        return this.readyQueueSubject.asObservable();
    }

    /**
     * 獲取資源的資料流
     * @returns 資源的 Observable
     */
    getResourceStream() {
        return this.resourceSubject.asObservable();
    }

    /**
     * 根據 PID 查找 PCB
     * @param pid 行程 ID
     * @returns PCB 物件或 undefined
     */
    getPcbByPid(pid: string): PCB | undefined {
        return this.table.find(pcb => pcb.pid === pid); // 根據 PID 查找 PCB
    }
}
