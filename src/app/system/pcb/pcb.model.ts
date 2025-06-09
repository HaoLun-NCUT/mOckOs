export class PCB {
    pid: string; // 行程唯一識別碼
    priority: number; // 行程優先級
    state: "New" | "Ready" | "Running" | "Waiting" | "Terminated"; // 行程狀態
    programCounter: number | undefined; // 程式計數器
    registers: number[]; // 暫存器
    memoryLimit: number; // 記憶體限制
    openFiles: Map<string,any>; // 已開啟的檔案列表
    resource:  Map<string,any>; // 資源列表 (例如：IO裝置、網路連線等)
    index_q: number; // 行程使用的佇列的索引
    doneOne: Function | undefined; // 用於行程完成一個單位的函式
    ready_to_running_Check: Function | undefined; // 用於檢查行程是否進入執行狀態的函式
    waiting_to_ready_Check: Function | undefined; // 用於檢查行程是否從等待狀態轉為備妥狀態的函式
    // 🔹 計時與排程相關屬性 🔹
    cumulativeWaitingTime: number; // 累計等待時間 (毫秒)
    cumulativeReadyTime: number; // 累計備妥時間 (毫秒)
    triggerTimestamp: number; // 觸發時間戳記 (Unix Timestamp)
    executionTime: number; // 預估執行時間 (毫秒)
    remainingTime: number; // 剩餘時間 (毫秒)
    isPeriodicTask: boolean; // 是否為週期性行程 (true: 週期性, false: 單次)
    isTimerActive: boolean; // 是否啟用定時器
    rungingTime: number;//已執行時間
    triggerSetter: Function | undefined;// 用於設定觸發時間的函式


    constructor(
        pid: string,
        priority: number = 0,
        state: "New" | "Ready" | "Running" | "Waiting" | "Terminated",
        programCounter: number | undefined,
        registers: number[],
        memoryLimit: number,
        openFiles: Map<string,any>,
        index_q: number, // 行程使用的佇列的索引
        resource:  Map<string,any>,
        doneOne: Function | undefined,
        ready_to_running_Check: Function | undefined,
        waiting_to_ready_Check: Function | undefined,
        remainingWaitTime: number,
        triggerTimestamp: number,
        isPeriodicTask: boolean,
        executionTime: number,
        isTimerActive: boolean,
        triggerSetter: Function | undefined
    ) {
        this.pid = pid;
        this.priority = priority;
        this.state = state;
        this.programCounter = programCounter;
        this.registers = registers;
        this.memoryLimit = memoryLimit;
        this.openFiles = openFiles;
        this.cumulativeWaitingTime = 0;
        this.cumulativeReadyTime = 0;
        this.remainingTime = remainingWaitTime;
        this.triggerTimestamp = triggerTimestamp;
        this.isPeriodicTask = isPeriodicTask;
        this.executionTime = executionTime;
        this.isTimerActive = isTimerActive;
        this.rungingTime = 0;
        this.triggerSetter = triggerSetter;
        this.resource = resource || []; // 初始化資源列表
        this.doneOne = doneOne; // 設置行程完成一個單位的函式
        this.ready_to_running_Check = ready_to_running_Check; // 設置檢查行程是否進入執行狀態的函式
        this.waiting_to_ready_Check = waiting_to_ready_Check; // 設置檢查行程是否從等待狀態轉為備妥狀態的函式
        this.index_q = index_q; // 設置行程使用的佇列的索引
    }

    commands: Function[] = []; // 儲存行程的指令

    // 🔹 更新剩餘時間 🔹
    updateRemainingTime(): void {
        this.remainingTime -= 1;
        this.rungingTime += 1;
    }

    // 🔹 啟動定時器 🔹
    activateTimer(): void {
        this.isTimerActive = true;
    }

    // 🔹 行程進入 Ready 🔹
    moveToReady(): void {
        this.state = "Ready";
    }

    // 🔹 行程進入 Running 🔹
    moveToRunning(): void {
        this.state = "Running";
    }

    // 🔹 行程進入 Waiting 🔹
    moveToWaiting(): void {
        this.state = "Waiting";
    }

    // 🔹 行程進入 Terminated 🔹
    moveToTerminated(): void {
        this.state = "Terminated";
    }

    // 🔹 執行時間歸0 🔹
    cleanRunningTime(): void {
        this.rungingTime = 0
    }

    // 🔹 更新累積等待時間 🔹
    updateWaitingTime(): void {
        this.cumulativeWaitingTime += 1;
    }

    // 🔹 更新累積備妥時間 🔹
    updateReadyTime(): void {
        this.cumulativeReadyTime += 1;
    }

    // 🔹 更新觸發 🔹
    updateTrigger(cpuTime: number): void {
        if (this.triggerSetter) {
            this.triggerSetter(cpuTime, this); // 如果有設定觸發函數，則調用它
        }
    }
}