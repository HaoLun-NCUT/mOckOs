import { Injectable } from '@angular/core';
import { PCB } from '../main/pcb/pcb.model';

@Injectable({
  providedIn: 'root',
})
export class AlgorithmService {
  constructor() {}

  /**
   * 1️⃣ 先到先服務（FCFS）
   * @param processes 行程列表
   * @returns 排序後的行程列表
   */
  fcfs(processes: PCB[]): PCB[] {
    return processes.sort((a, b) => a.triggerTimestamp - b.triggerTimestamp);
  }

  /**
   * 2️⃣ 依序循環（RR - Round-Robin）
   * @param processes 行程列表
   * @param timeQuantum 時間片大小
   * @returns 模擬執行的順序
   */
  roundRobin(processes: PCB[], timeQuantum: number): PCB[] {
    const queue: PCB[] = [...processes];
    const result: PCB[] = [];
    let currentTime = 0;

    while (queue.length > 0) {
      const process = queue.shift()!;
      if (process.executionTime > timeQuantum) {
        // 部分執行，剩餘時間減少
        process.executionTime -= timeQuantum;
        currentTime += timeQuantum;
        queue.push(process); // 將未完成的行程移至隊列尾端
      } else {
        // 完全執行
        currentTime += process.executionTime;
        process.executionTime = 0;
        process.state = 'Terminated';
        result.push(process);
      }
    }

    return result;
  }

  /**
   * 3️⃣ 最短行程優先（SPN）
   * @param processes 行程列表
   * @returns 排序後的行程列表
   */
  spn(processes: PCB[]): PCB[] {
    return processes.sort((a, b) => a.executionTime - b.executionTime);
  }

  /**
   * 4️⃣ 最短剩餘時間（SRT）
   * @param processes 行程列表
   * @returns 模擬執行的順序
   */
  srt(processes: PCB[]): PCB[] {
    const queue: PCB[] = [...processes];
    const result: PCB[] = [];
    let currentTime = 0;

    while (queue.length > 0) {
      // 找到剩餘執行時間最短的行程
      queue.sort((a, b) => a.executionTime - b.executionTime);
      const process = queue.shift()!;

      if (process.triggerTimestamp <= currentTime) {
        currentTime += process.executionTime;
        process.executionTime = 0;
        process.state = 'Terminated';
        result.push(process);
      } else {
        currentTime = process.triggerTimestamp;
      }
    }

    return result;
  }
}
