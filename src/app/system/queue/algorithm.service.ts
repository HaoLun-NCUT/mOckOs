import { inject, Injectable } from '@angular/core';
import { PCB } from '../pcb/pcb.model';
import { Queue } from './queue.class';
import { CpuService } from '../cpu/cpu.service';
import { PcbService } from '../pcb/pcb.service';
/**
 *
 *
 * @export
 * @class AlgorithmService
 */
@Injectable({
    providedIn: 'root',
})
export class AlgorithmService {
    //注入CPU服務
    cpuService = inject(CpuService);
    //注入PCB服務
    pcbService = inject(PcbService);

    //總共的PCB
    pcbTable!: PCB[]; // 獲取 PCB 資料表

    //訂閱CPU時間
    kernelTime!: number

    readyQueues: Queue[] = [];
    waitingQueue: Queue = new Queue("Waiting", "等待佇列", 1000);
    runningSpace: Queue = new Queue("Running", "執行佇列", 1);

    constructor() {
        this.pcbService.getReadyQueueStream().subscribe(
            (queueField) => {
                this.setReadyQueue(queueField); // 更新備妥佇列
            })
        this.cpuService.getTimeStream().subscribe(
            (kernelTime) => {
                this.kernelTime = kernelTime; // 更新當前核心時間
                this.reLock.clear();
            }
        );
        this.pcbService.getResourceStream().subscribe(
            (resources) => {
                resources.forEach(resource => {
                    this.baseRegistry.set(resource.id, { ...resource }); // 將資源加入資源倉庫
                });
            }
        );

        this.pcbService.getTableStream().subscribe(
            (pcbStream) => {
                this.cleanQuere();
                pcbStream.forEach(pcb => {
                    // 將每個 PCB 全都放進等待佇列
                    this.waitingQueue.setPcb(pcb, this.registry);
                    this.pcbTable = pcbStream; // 更新 PCB 資料表
                })

            }
        );
    }

    registry: Map<string, any> = new Map(); // 資源倉庫
    baseRegistry: Map<string, any> = new Map(); // 基礎資源倉庫

    reLock: Set<string> = new Set<string>(); // 用於記錄被鎖定的行程 PID

    //存放被IO變更狀態，無家可歸的行程
    homelessPcbs: Map<string, PCB> = new Map<string, PCB>();

    //強制行程進入某個佇列
    forceTo = (pcb: PCB | string, target: "Ready" | "Waiting" | "Running") => {
        if (typeof pcb === "string") {
            pcb = this.pcbService.getPcbByPid(pcb) as PCB; // 如果傳入的是 PID，則通過 PCB 服務獲取對應的 PCB
        }
        if (pcb.state === target) {
            return; // 如果行程已經在目標狀態，則不需要進行任何操作
        }
        let oldState = pcb.state; // 保存行程的原始狀態
        switch (oldState) {
            case "Ready":
                return; // 如果行程已經在備妥佇列中，則不需要進行任何操作
            case "Waiting":
                this.waitingQueue.extractPcb(p => p.pid == pcb.pid, [1]); // 從等待佇列中移除行程
                break; // 如果行程在等待佇列中，則打印日誌
            case "Running":
                this.runningSpace.extractPcb(p => p.pid == pcb.pid, [1]); // 從等待佇列中移除行程
                break;
            default:
                console.error(`未知的行程狀態：${oldState}`); // 如果行程狀態未知，則打印錯誤日誌
                return;
        }

        switch (target) {
            case "Ready":
                this.readyQueues[pcb.index_q].setPcb(pcb, this.registry); // 將行程放入備妥佇列
                break;
            case "Waiting":
                this.waitingQueue.setPcb(pcb, this.registry); // 將行程放入等待佇列
                break;
            case "Running":
                this.runningSpace.setPcb(pcb, this.registry); // 將行程放入執行空間
                break;
        }
        pcb.state = target; // 設置行程狀態為目標狀態
    }


    //依據其狀態，將PCB從對應的佇列中強行移出並放置到homelessPcbs，並設置為指定狀態
    homelessPcb = (pcb: PCB, newState: "Ready" | "Waiting" | "Running") => {
        switch (pcb.state) {
            case "Ready":
                // 從備妥佇列中移除行程
                this.readyQueues[pcb.index_q].extractPcb(p => p.pid == pcb.pid, [1]);
                break;
            case "Waiting":
                // 從等待佇列中移除行程
                this.waitingQueue.extractPcb(p => p.pid == pcb.pid, [1]);
                break;
            case "Running":
                // 從執行空間中移除行程
                this.runningSpace.extractPcb(p => p.pid == pcb.pid, [1]);
                break;
        }
        this.homelessPcbs.set(pcb.pid, pcb); // 將行程放入無家可歸的行程陣列
        pcb.state = newState; // 設置行程狀態
    }

    //IO插斷，遍例homelessPcbs，依據狀態將行程放入對應的佇列
    homelessPcbToQueue() {
        this.homelessPcbs.forEach((pcb) => {
            console.log(`將行程 ${pcb.pid} 狀態 ${pcb.state} 放入對應的佇列`);
            switch (pcb.state) {
                case "Ready":
                    // 將行程放入備妥佇列
                    this.readyQueues[pcb.index_q].setPcb(pcb, this.registry);
                    break;
                case "Waiting":
                    // 將行程放入等待佇列
                    this.waitingQueue.setPcb(pcb, this.registry);
                    pcb.triggerSetter?.(this.kernelTime, pcb); // 如果有設定觸發函數，則調用它
                    break;
                case "Running":
                    // 將行程放入執行空間
                    this.runningSpace.setPcb(pcb, this.registry);
                    break;
            }
        });
        this.homelessPcbs.clear(); // 清空無家可歸的行程集合
    }



    //建立備妥佇列
    setReadyQueue(queueField: { title: string, max_length: number }[]) {
        this.readyQueues.length = 0;

        queueField.forEach(({ title, max_length }) =>
            this.readyQueues.push(new Queue("Ready", title, max_length))
        )
    }

    /**
     * 設定核心數量
     */
    setMaxCore(core: number) {
        this.runningSpace.setMaxLength(core);
    }

    /**
     *演算法選項
     */
    algorithmOptions = [
        { label: '優先度優先 (Priority)搶佔', value: (kernelTime: number) => this.priority_occupy(kernelTime) },
        { label: '銀行家演算法 (Banker)', value: (kernelTime: number) => this.banker(kernelTime) },
        { label: '最短行程優先 (SPN/SJF)不搶佔', value: (kernelTime: number) => this.sjf_fcfs(kernelTime) },
        { label: '最短行程優先 (SPN/SJF)搶佔', value: (kernelTime: number) => this.sjf_occupy(kernelTime) },
        { label: '先到先服務 (FCFS)', value: (kernelTime: number) => this.fcfs(kernelTime) },
        { label: '依序循環 (RR)', value: (kernelTime: number) => this.roundRobin(3, kernelTime) },
        { label: '最短剩餘時間 (SRT)搶佔', value: (kernelTime: number) => this.srt(kernelTime) },
    ];

    /**清空佇列 */
    cleanQuere() {
        this.readyQueues.forEach(queue => queue.clean()); // 清空備妥佇列
        this.waitingQueue.clean(); // 清空等待佇列
        this.runningSpace.clean(); // 清空執行空間
        this.homelessPcbs.clear(); // 清空無家可歸的行程
        this.registry.clear(); // 清空資源倉庫
        this.baseRegistry.clear(); // 清空基礎資源倉庫
    }


    /** 
     * @description 佇列刷新
     * @param kernelTime 當前核心時間
     * @param firstFn 首先執行的函數
     * @param readytoRun 備妥佇列排班函數
     * @param sortFn 排序函數
    */
    refreshState(kernelTime: number, firstFn?: Function, readytoRun?: Function, sortFn?: (a: PCB, b: PCB) => number) {
        // 移除執行空間中剩餘時間為0的行程
        this.runningSpace.removeZeroRemainingTime(this);

        // 首先進行排程演算法指定操作
        firstFn?.();

        // 將無家可歸的行程重新放入對應的佇列
        this.homelessPcbToQueue();

        // 如果排成程算法readytoRun有指定的函數，則執行它
        readytoRun?.();

        // 將執行空間的行程按照指定方法排序
        if (sortFn) {
            this.runningSpace.sort(sortFn);
        }


        //執行空間溢出檢查
        let overFromRunningSpace = this.runningSpace.getPcb_ifOverflow()
        // 將行程逐一放入備妥佇列
        overFromRunningSpace.forEach(pcb =>
            this.readyQueues[pcb.index_q].setPcb(pcb, this.registry)
        );

        //取得備妥佇列的空位
        let spaces = this.readyQueues.map(q => q.getSpace());
        // 取得等待佇列中觸發時間已過的行程陣列，不得大於備妥佇列的空位
        let readyPcbs = this.waitingQueue.extractPcb((pcb) => {
            return pcb.isTimerActive && pcb.triggerTimestamp <= kernelTime
        }
            ,
            spaces
        );
        // 將行程逐一加入備妥佇列
        readyPcbs.forEach(pcb => {
            this.readyQueues[pcb.index_q].setPcb(pcb, this.registry);
        });

        // 將備妥佇列中的行程按照指定方法排序
        if (sortFn) {
            this.readyQueues.forEach(queue => {
                queue.sort(sortFn);
            });
        }

        //備妥佇列溢出檢查
        let overFromReadyQueue = this.readyQueues.reduce(
            (acc, queue) => acc.concat(queue.getPcb_ifOverflow()), [] as PCB[]
        );
        // 將行程逐一放入等待佇列，並調用triggerSetter進行設置
        overFromReadyQueue.forEach(pcb => {
            this.waitingQueue.setPcb(pcb, this.registry);
            if (pcb.triggerSetter) {
                pcb.updateTrigger(kernelTime); // 設置觸發
            }
        });

        //將等待佇列中的行程按照指定方法排序
        if (sortFn) {
            this.waitingQueue.sort(sortFn);
        }

    }

    /**
     * 正在執行中業務邏輯
     */
    running() {
        this.runningSpace.updatePcbTime() // 對執行空間中的行程更新剩餘時間
        this.runningSpace.queue.forEach(pcb => {
            pcb.doneOne?.(
                pcb,
                this,
                //this.homelessPcb
            ); // 執行每個行程的 doneOne 方法
            if (pcb.remainingTime <= 0) {
                pcb.moveToTerminated(); // 如果剩餘時間為0，則將行程狀態設置為 Terminated
            }
        })
        this.waitingQueue.updatePcbTime() // 對備妥佇列中的行程更新等待時間
        this.readyQueues.forEach(queue => queue.updatePcbTime()) // 對備妥佇列中的行程更新等待時間

    }

    /**
     * 非搶佔排班（備妥佇列 => 執行空間）
     */
    readyToRunSave = () => {

        console.log("不搶佔");
        //如果執行空間沒有滿，且備妥佇列有行程，則將備妥佇列中的對應數量的行程移入執行空間
        if (this.runningSpace.hasSpace() && !this.readyQueues[0].isEmpty()) {
            let movePcbs: PCB[] = [];
            this.readyQueues.forEach(queue =>
                movePcbs.push(...queue.extractPcb(pcb =>
                    //先執行check函式，檢查行程是否可以進入執行狀態
                    pcb.ready_to_running_Check?.(pcb, this) ?? true
                    , [Infinity, Infinity, Infinity, Infinity,])));
            movePcbs.forEach((pcb) => {
                this.runningSpace.setPcb(pcb, this.registry); // 將 PCB 加入執行空間
            })
        }
    }

    // 搶佔排班（備妥佇列 => 執行空間）
    readyToRunForce = () => {
        let movePcbs: PCB[] = [];
        this.readyQueues.forEach(queue =>
            movePcbs.push(...queue.extractPcb(pcb =>
                //先執行check函式，檢查行程是否可以進入執行狀態
                pcb.ready_to_running_Check?.(pcb, this) ?? true
                , [Infinity, Infinity, Infinity, Infinity,])));
        movePcbs.forEach(pcb => {
            console.log(`行程 ${pcb.pid} 準備進入執行空間`);
            this.runningSpace.setPcb(pcb, this.registry);
        })
    }

    /**
     * 1️⃣ 先到先服務（FCFS）
     * @param processes 行程列表
     * @returns 排序後的行程列表
     */
    fcfs(kernelTime: number): void {
        this.refreshState(kernelTime,
            undefined,
            this.readyToRunSave
        );//刷新佇列狀態
        this.running();//執行
    }

    /**
     * 2️⃣ 依序循環（RR - Round-Robin）
     * @param processes 行程列表
     * @param timeQuantum 時間片大小
     * @returns 模擬執行的順序
     */
    roundRobin(timeQuantum: number, kernelTime: number): void {
        this.refreshState(
            kernelTime,
            () => {
                //遍歷執行空間中的行程，如果執行時間大於等於時間片，則將行程移出執行空間
                let timeoutPcb = this.runningSpace.extractPcb((pcb) => pcb.rungingTime >= timeQuantum, [Infinity]);
                //並逐一加入備妥佇列
                timeoutPcb.forEach(pcb => this.readyQueues[pcb.index_q].setPcb(pcb, this.registry));
            },
            this.readyToRunSave
        );
        this.running();//執行中業務邏輯
    }

    /**
     * 3️⃣ 最短剩餘時間（SRT - Shortest Remaining Time）
     * @param processes 行程列表
     * @returns 模擬執行的順序
     */
    srt(kernelTime: number): void {
        this.refreshState(
            kernelTime,
            undefined,
            this.readyToRunForce,
            (a, b) => a.remainingTime - b.remainingTime
        );
        this.running();//執行中業務邏輯
    }

    /**
    * 4️⃣ 最短行程優先（SPN/SJF - Shortest Process Next /Shortest Job First）
    * @description 這個演算法會選擇預估執行時間最短的行程來執行，允許搶佔。
    * @param processes 行程列表
    * @returns 排序後的行程列表
    */
    sjf_occupy(kernelTime: number): void {
        this.refreshState(
            kernelTime,
            undefined,
            this.readyToRunForce,
            (a, b) => a.executionTime - b.executionTime);
        this.running();//執行中業務邏輯
    }

    /**
    * 5️⃣ 最短行程優先（SPN/SJF - Shortest Process Next /Shortest Job First）
    * @description 這個演算法會選擇預估執行時間最短的行程來執行，不允許搶佔。
    * @param processes 行程列表
    * @returns 排序後的行程列表
    */
    sjf_fcfs(kernelTime: number): void {
        this.refreshState(
            kernelTime,
            undefined,
            this.readyToRunSave,
            (a, b) => a.executionTime - b.executionTime);
        this.running();//執行中業務邏輯
    }

    /**
    *6️⃣ 優先度優先
    * @description 這個演算法會選擇優先度最高的行程來執行，允許搶佔。
    * @param processes 行程列表
    * @returns 排序後的行程列表
    */
    priority_occupy(kernelTime: number): void {
        this.refreshState(
            kernelTime,
            undefined,
            this.readyToRunForce,
            (a, b) => a.priority - b.priority
        );
        this.running();//執行中業務邏輯
    }

    // 儲存已計算出的安全序列 (PCB 列表)
    safeSequences: PCB[][] = [];

    //離開的資源
    releasedResources: Map<string, number> = new Map(); // 用於儲存釋放的資源

    //計算安全序列
    public calculateSafeSequence = (whatIF?: { pid: string, A: number, B: number, C: number, D: number }) => {
        //所有排列組合(不一定安全)
        let allSequences: PCB[][] = [];
        console.log("計算安全序列", allSequences);

        //取得執行空間的行程的資源
        this.runningSpace.queue.forEach(pcb => {
            pcb.resource.forEach((file, key) => {
                if (file.type) {
                    const resource = this.baseRegistry.get(file.type);
                    if (resource) {
                        resource.Available += file.Allocation; // 增加資源的可用數量
                        file.Allocation = 0; // 將行程的分配數量設置為0
                    }
                }
            })
        })

        let findNextSafePCB = (allPCB: PCB[], _registry: Map<string, any>, safe: PCB[]) => {

            for (let i = 0; i < allPCB.length; i++) {
                let pcb = allPCB[i]; // 取得當前行程
                let r = new Map(
                    [..._registry].map(([key, value]) => [key, structuredClone(value)])
                );
                //如果A資源的Need大於A資源的總數，則跳過
                if (pcb.resource.get(`A-${pcb.pid}`).Need > r.get(`A`).Available) {
                    continue;
                }
                //如果B資源的Need大於B資源的總數，則跳過
                if (pcb.resource.get(`B-${pcb.pid}`).Need > r.get(`B`).Available) {
                    continue;
                }
                //如果C資源的Need大於C資源的總數，則跳過
                if (pcb.resource.get(`C-${pcb.pid}`).Need > r.get(`C`).Available) {
                    continue;
                }
                //如果D資源的Need大於D資源的總數，則跳過
                if (pcb.resource.get(`D-${pcb.pid}`).Need > r.get(`D`).Available) {
                    continue;
                }
                let newPCBS = allPCB.filter(p => p.pid !== pcb.pid); // 創建一個新的行程陣列，排除當前行程
                //將行程ABCD的Allocation加到_regis的ABCD的Available上
                r.get(`A`).Available += pcb.resource.get(`A-${pcb.pid}`).Allocation;
                r.get(`B`).Available += pcb.resource.get(`B-${pcb.pid}`).Allocation;
                r.get(`C`).Available += pcb.resource.get(`C-${pcb.pid}`).Allocation;
                r.get(`D`).Available += pcb.resource.get(`D-${pcb.pid}`).Allocation;
                allSequences.push([...safe, pcb])
                findNextSafePCB([...newPCBS], r, [...safe, pcb]);
            }

        }


        //從備妥佇列中取得所有行程
        let allPCB: PCB[] = [];
        this.readyQueues.forEach(queue => {
            allPCB.push(...queue.queue);
        });


        let rrr = new Map(
            [...this.baseRegistry].map(([key, value]) => [key, structuredClone(value)])
        );

        //找到whatIF行程
        if (whatIF) {

            allPCB = allPCB.map(pcb => {
                let result = structuredClone(pcb)
                //先將行程的資源深層複製，避免修改原始行程
                pcb.resource = new Map(
                    [...pcb.resource].map(([key, value]) => [key, structuredClone(value)]))
                return result
            });
            let xxx = allPCB.find(pcb => pcb.pid === whatIF.pid)
            //深層複製行程
            if (xxx) {

                xxx.resource.forEach((file, key) => {
                    file.Need += file.Need; // 增加資源的需求數量
                })
            }
            //將baseRegistry的資源減去whatIF的資源
            rrr.get("A")!.Available -= whatIF.A;
            rrr.get("B")!.Available -= whatIF.B;
            rrr.get("C")!.Available -= whatIF.C;
            rrr.get("D")!.Available -= whatIF.D;
        }

        //使用findNextSafePCB函式來尋找所有可能的安全序列
        findNextSafePCB(allPCB, rrr, []);
        if (whatIF) {
            let result = [];
            allSequences.forEach(sequence => {
                if (sequence.length == allPCB.length) {
                    result.push(sequence);
                }
            })
            //如果備妥佇列為空，則返回true
            if (allPCB.length === 0
                && rrr.get("A")!.Available - whatIF.A > 0
                && rrr.get("B")!.Available - whatIF.B > 0
                && rrr.get("C")!.Available - whatIF.C > 0
                && rrr.get("D")!.Available - whatIF.D > 0) {
                return true; // 沒有找到安全序列
            }
            return result.length > 0; // 返回找到的安全序列

        } else {
            //遍歷allSequences，將陣列長度等於備妥佇列行程總數的序列加入到safeSequences
            allSequences.forEach(sequence => {
                if (sequence.length == allPCB.length) {
                    this.safeSequences.push(sequence);

                }
            });
            return true;
        }

    }

    //銀行家演算法隨機數
    random = 0

    /**
    * 7️⃣ 銀行家演算法 (Banker's Algorithm)
    * @description 透過尋找安全序列來避免死結。行程將依照一個預先算好的安全序列來排序執行。
    * @param kernelTime 當前核心時間
    */
    banker(kernelTime: number): void {
        //清空安全佇列
        this.safeSequences = []; // 清空已計算的安全序列
        //計算安全序列
        this.calculateSafeSequence();

        this.random = Math.floor(Math.random() * this.safeSequences.length)


        //從安全序列隨機選擇一個序列
        let safeSequence = this.safeSequences[this.random];

        //如果沒有安全序列，則選擇最長的佇列
        if (!safeSequence || safeSequence.length === 0) {
            console.warn("沒有安全序列，使用最長的佇列");
            safeSequence = this.readyQueues.reduce((longest, queue) => {
                return queue.queue.length > longest.length ? queue.queue : longest;
            }, [] as PCB[]);

            //並且將備妥佇列不再此序列中的行程呼叫homelessPcb變成waiting狀態
            this.readyQueues.forEach(queue => {
                queue.queue.forEach(pcb => {
                    if (!safeSequence.includes(pcb)) {
                        this.homelessPcb(pcb, "Waiting"); // 將行程設置為無家可歸狀態
                    }
                });
            })
        }



        this.refreshState(
            kernelTime,
            undefined,
            this.readyToRunSave, // 使用非搶佔式排班，因為順序已由排序決定
            // 依照safeSequence進行排序
            (a, b) => safeSequence.indexOf(a) - safeSequence.indexOf(b)
        );

        this.running(); // 執行核心業務邏輯
    }
}
