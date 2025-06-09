
import { resource } from "@angular/core";
import { PCB } from "../pcb/pcb.model";
import { AlgorithmService } from "./algorithm.service";

type Quere_type = "New" | "Ready" | "Waiting" | "Running";

export class Queue {
    readonly quere_name: string; // 佇列名稱
    readonly quere_type: Quere_type; // 佇列類型
    readonly queue: PCB[]; // 備妥佇列
    private max_length: number; // 等待佇列最大長度

    constructor(quere_type: Quere_type, quere_name: string, max_length: number) {
        this.quere_type = quere_type; // 設置佇列類型
        this.quere_name = quere_name; // 設置佇列名稱
        this.queue = []; // 初始化佇列
        this.max_length = max_length; // 設置佇列最大長度
    }

    /**
     * 佇列中所有的PCB進行時間更新
     */
    updatePcbTime(): void {
        this.queue.forEach((pcb) => {
            switch (this.quere_type) {
                case "Ready":
                    pcb.updateReadyTime(); // 更新備妥佇列中的 PCB 時間
                    break;
                case "Waiting":
                    pcb.updateWaitingTime(); // 更新等待佇列中的 PCB 時間
                    break;
                case "Running":
                    pcb.updateRemainingTime(); // 更新執行中佇列中的 PCB 時間
                    break;
            }
        })
    };

    //查看第一個PCB
    watchFirstPcb(): PCB | undefined {
        return this.queue[0]; // 返回佇列中的第一個 PCB
    }

    // 將指定數量的以內的，符合指定條件的 PCB 從佇列中取出
    extractPcb(
        condition: (pcb: PCB) => boolean, // 條件函數，用於過濾 PCB
        needs: number[] // 需要提取的 PCB 數量陣列
    ): PCB[] {
        const extractedPcbs: PCB[] = [];
        needs.forEach((need) => {
            for (let i = 0; i < this.queue.length && need > 0; i++) {
                const pcb = this.queue[i];
                if (condition(pcb)) {
                    extractedPcbs.push(this.queue.splice(i, 1)[0]); // 使用 splice 移除並返回符合條件的 PCB
                    pcb.cleanRunningTime(); // 清除其運行時間
                    i--; // 調整索引以補償移除元素後的變化
                    need--; // 減少需要提取的數量
                }
            }
        })

        return extractedPcbs; // 返回提取的 PCB 陣列
    }

    // 將 PCB 加入佇列，並設置狀態
    setPcb(
        p: PCB,
        registry?: Map<string, any> // 可選的資源倉庫，用於存儲 PCB 的資源
    ): void {
        this.queue.push(p); // 將 PCB 加入佇列
        switch (this.quere_type) {
            case "Ready":
                p.isTimerActive = false; // 取消定時器
                p.moveToReady(); // 將 PCB 狀態設置為 Ready
                p.resource.forEach(r => {
                    // 將 PCB的資源加入倉庫
                    registry?.set(r.id, r)

                    if (r.type)
                    //如果是有類型的資源中，則立即開啟
                    {p.openFiles.set(r.id, r)}
                }
                );
                break;
            case "Waiting":
                p.moveToWaiting(); // 將 PCB 狀態設置為 Waiting
                break;
            case "Running":
                p.moveToRunning(); // 將 PCB 狀態設置為 Running
                break;
            default:
                throw new Error(`Unknown queue type: ${this.quere_type}`); // 如果佇列類型未知，則拋出錯誤
        }
    };

    //經過某種判斷後，將兩個佇列中的PCB交換
    exchangePcb(
        condition: (pcb: PCB) => boolean, // 條件函數，用於過濾 PCB
        targetQueue: Queue // 目標佇列
    ): void {
        //如果目標佇列或當前佇列為空，則不進行任何操作
        if (this.queue.length === 0 || targetQueue.queue.length === 0) {
            return; // 如果當前佇列或目標佇列為空，則不進行任何操作
        }
        const pcb = this.extractPcb(condition, [1])[0]; // 從當前佇列中取出符合條件的 PCB
        if (pcb) {
            targetQueue.setPcb(pcb); // 將 PCB 加入目標佇列
        }
    };

    // 設定佇列最大長度
    setMaxLength(
        max_length: number
    ): void {
        this.max_length = max_length; // 設置佇列最大長度
    };

    //取得佇列剩餘空間
    getSpace(): number {
        return this.max_length - this.queue.length;
    };

    //取得佇列長度
    getLength(): number {
        return this.queue.length; // 返回佇列長度
    }

    //使用某種演算法排序佇列
    sort(
        algorithm: (a: PCB, b: PCB) => number
    ): void {
        this.queue.sort(algorithm);
    }

    //清空佇列
    clean(): void {
        this.queue.length = 0; // 清空佇列
    }

    // 檢查佇列是否還有空位
    hasSpace(): boolean {
        return this.queue.length < this.max_length; // 如果佇列長度小於最大長度，則返回 true
    }

    // 將溢出的PCB從佇列中取出
    getPcb_ifOverflow(): PCB[] {
        if (this.queue.length > this.max_length) {
            // 如果佇列長度大於最大長度，則返回溢出的 PCB
            return this.queue.splice(this.max_length); // 使用 splice 方法從佇列中移除並返回溢出的 PCB
        }
        return []; // 如果沒有溢出，則返回空陣列
    }

    // 檢查佇列是否為空
    isEmpty(): boolean {
        return this.queue.length === 0; // 如果佇列長度為 0，則返回 true
    }

    // 將時間為0的PCB的狀態設置為 Terminated 並且移除
    removeZeroRemainingTime(as: AlgorithmService): void {
        // 從陣列的末尾開始向前迭代
        for (let i = this.queue.length - 1; i >= 0; i--) {
            const pcb = this.queue[i];
            if (pcb.remainingTime <= 0) {
                pcb.rungingTime = 0; // 將已執行時間清零
                // 使用 splice 移除當前元素。
                // splice(i, 1) 會返回一個包含被移除元素的陣列，
                // 我們取其第一個元素 ([0]) 就是被移除的 PCB。
                const removedPcb = this.queue.splice(i, 1)[0];

                //遍歷開啟的檔案，將userPid設為""
                removedPcb.openFiles.forEach((file) => {
                    file.userPid = ""; // 清除檔案的 userPid
                    // 如果檔案有type，則as.registry中type相同的資源的Available數值加上此檔案的Allocation數值

                });
                
                // 清除已開啟的檔案
                removedPcb.openFiles.clear();


                // 副作用：檢查pcb是否為重複執行，是的話改為waiting，並設置觸發器 
                if (removedPcb.isPeriodicTask) {
                    removedPcb.updateTrigger(as.kernelTime);
                    removedPcb.moveToWaiting(); // 如果是週期性行程，則將其狀態設置為 Waiting
                    as.waitingQueue.setPcb(removedPcb); // 將其加入等待佇列
                } else {
                    removedPcb.moveToTerminated(); // 否則將其狀態設置為 Terminated
                }
            }
        }
    }
}



