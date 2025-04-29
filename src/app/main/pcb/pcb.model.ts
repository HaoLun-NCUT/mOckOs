export class PCB {
  pid: string; // 行程唯一識別碼
  priority: number | undefined; // 行程優先級
  state: "New" | "Ready" | "Running" | "Waiting" | "Terminated"; // 行程狀態
  programCounter: number | undefined; // 程式計數器
  registers: number[]; // 暫存器
  memoryLimit: number; // 記憶體限制
  openFiles: string[]; // 已開啟的檔案列表
  // 🔹 計時與排程相關屬性 🔹
  cumulativeWaitingTime: number; // 累計等待時間 (毫秒)
  cumulativeReadyTime: number; // 累計備妥時間 (毫秒)
  triggerTimestamp: number; // 觸發時間戳記 (Unix Timestamp)
  executionTime: number; // 預估執行時間 (毫秒)
  remainingTime: number; // 剩餘時間 (毫秒)
  isPeriodicTask: boolean; // 是否為週期性行程 (true: 週期性, false: 單次)
  isTimerActive: boolean; // 是否啟用定時器
  rungingTime: number;//已執行時間

  constructor(
    pid: string,
    priority: number | undefined,
    state: "New" | "Ready" | "Running" | "Waiting" | "Terminated",
    programCounter: number | undefined,
    registers: number[],
    memoryLimit: number,
    openFiles: string[],
    remainingWaitTime: number,
    triggerTimestamp: number,
    isPeriodicTask: boolean,
    executionTime: number,
    isTimerActive: boolean,
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
  }

  // 🔹 更新剩餘時間 🔹
  updateRemainingTime(usedTime: number): void {
    this.remainingTime -= usedTime;
    this.rungingTime += usedTime;
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
}