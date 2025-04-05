export interface Process {
  pid: string;
  triggerTimestamp: number; // 觸發時間戳記
  executionTime: number; // 行程執行時間
}

export const table: Process[][] = [
  [
    { pid: "A", triggerTimestamp: 0, executionTime: 5 },
    { pid: "B", triggerTimestamp: 2, executionTime: 7 },
    { pid: "C", triggerTimestamp: 5, executionTime: 10 },
    { pid: "D", triggerTimestamp: 7, executionTime: 8 },
    { pid: "E", triggerTimestamp: 8, executionTime: 15 },
    { pid: "F", triggerTimestamp: 12, executionTime: 25 },
    { pid: "G", triggerTimestamp: 15, executionTime: 12 },
  ],
  [
    { pid: "A", triggerTimestamp: 0, executionTime: 4 },
    { pid: "B", triggerTimestamp: 2, executionTime: 9 },
    { pid: "C", triggerTimestamp: 5, executionTime: 6 },
    { pid: "D", triggerTimestamp: 10, executionTime: 12 },
    { pid: "E", triggerTimestamp: 15, executionTime: 20 },
  ]
];