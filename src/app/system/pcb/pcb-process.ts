import { count, using } from 'rxjs';
import { AlgorithmService } from './../queue/algorithm.service';
import { PCB } from "./pcb.model";

export interface Process {
    pid: string;
    triggerTimestamp: number; // 觸發時間戳記
    executionTime: number; // 行程執行時間
    resource?: () => any[]; // 資源列表 (例如：IO裝置、網路連線等)
    ready_to_running_Check?: (self: PCB, as: AlgorithmService) => boolean; // 用於檢查行程是否進入執行狀態的函式
    waiting_to_ready_Check?: (self: PCB, registry: any[]) => boolean; // 用於檢查行程是否從等待狀態轉為備妥狀態的函式
    doneOne?: (self: PCB, as: AlgorithmService) => void; // 用於行程完成一個單位的函式
    triggerSetter?: Function; // 用於設定觸發時間的函式
    priority?: number; // 行程的初始優先度
    isPeriodicTask?: boolean; // 是否為週期性行程
    isTimerActive?: boolean; // 是否啟用定時器
    index_q?: number; // 行程使用的佇列的索引
}

export const processTables: {
    title: string,
    baseResources?: any[]
    readyQueues: { title: string, max_length: number }[],
    makePs: Function, // 用於生成行程的函式
    ps: Process[]
}[] = [
        {
            title: "睡覺的助教",
            readyQueues: [{ title: "備妥佇列(走廊)", max_length: 6 }, { title: "備妥佇列(教室)", max_length: 2 }], // 助教的備妥佇列和執行佇列
            makePs: function (count: number = 20) {
                // 生成學生行程
                const students: Process[] = [];
                for (let i = 1; i <= count; i++) {
                    students.push({
                        pid: `學生${i}`,
                        triggerSetter: (cpuTime: number, self: PCB) => {
                            self.isTimerActive = true; // 啟用定時器
                        },
                        //隨機3~4或61~62秒的觸發時間
                        triggerTimestamp: Math.floor(Math.random() * 2) === 0 ?
                            Math.floor(Math.random() * 2) + 3 :
                            Math.floor(Math.random() * 2) + 61,
                        // 隨機執行時間1~5秒(1~5個問題)
                        executionTime: Math.floor(Math.random() * 5) + 1,
                        priority: 0, // 初始優先度為0
                        ready_to_running_Check: (self: PCB, as: AlgorithmService) => {
                            // 檢查desk是否存在且可用，或正被自己使用
                            let desk = as.registry.get("desk");
                            if (!desk) {
                                // 如果desk不存在，則呼叫ioCall將助教喚醒
                                as.forceTo("TA", "Ready");
                                desk = as.registry.get("desk");
                            }
                            if (desk.available || desk.userPid == self.pid) {
                                // 如果desk可用，則將自身的userPid設為當前行程的pid
                                desk.userPid = self.pid; // 設定使用者 PID 為當前行程的 PID
                                self.openFiles.set("desk", desk); // 將桌子加入已開啟的檔案列表
                                self.index_q = 1; // 設定行程使用的佇列索引為1(教室備妥佇列)
                                //並且將其設為不可用
                                desk.available = false; // 設定為不可用狀態
                                return true; // 返回true表示行程可以進入執行狀態
                            } else {
                                return false;
                            }
                        },
                        doneOne: (self: PCB, as: AlgorithmService) => {
                            //每做完一次就將優先度加2
                            self.priority += 2;
                            //如果自身執行時間為0，則釋放userPid
                            if (self.executionTime <= 0) {
                                as.registry.forEach(r => {
                                    if (r.id == "desk" && r.userPid == self.pid) {
                                        r.userPid = ""; // 釋放使用者 PID
                                    }
                                });
                            }
                        }
                    });
                }
                return [...this.ps, ...students]
            },
            ps: [
                {
                    pid: "TA",
                    index_q: 1, // 助教使用的佇列索引(教室備妥佇列)
                    triggerTimestamp: 0,
                    executionTime: Infinity, // 助教的執行時間為無限大，它會一直存在
                    priority: 1, // 助教的初始優先度為1
                    isPeriodicTask: true, // 助教是週期性行程
                    isTimerActive: false, // 助教不啟用定時器
                    doneOne: (self: PCB, as: AlgorithmService) => {
                        //每做完一次就將優先度加2
                        self.priority += 2;
                        // 取得桌子
                        const desk = as.registry.get("desk");
                        // 如果學生登記中
                        if (desk.userPid != "") {
                            // 如果桌子已被登記，則助教備妥
                            console.log(desk.userPid, "請提問");
                        } else if (desk.available) {
                            // 如果桌子可用，沒被登記
                            // 將桌子從倉庫中移除，助教睡覺
                            console.log("助教", self.pid, "睡覺");
                            as.registry.delete("desk");
                            as.forceTo(self, "Waiting");
                        } else if (!desk.available) {
                            // 如果桌子不可用，沒被登記
                            console.log("助教", self.pid, "釋放桌子");
                            self.priority = 1; // 助教的優先度歸1
                            desk.available = true;
                            desk.userPid = ""; // 助教釋放桌子
                        };
                    },
                    resource: () => {
                        return [
                            {
                                id: "desk",
                                ownerPid: "TA",
                                userPid: "",
                                available: true, // 桌子初始為可用狀態
                            }
                        ]
                    },
                }
            ]
        },
        {
            title: "哲學家進餐",
            readyQueues: [{ title: "備妥佇列", max_length: 10 }],
            //批次的公版(預設9個哲學家)
            makePs: function (count: number = 9) {
                let ps: Process[] = [];
                for (let i = 1; i <= count; i++) {
                    ps.push({
                        pid: `哲學家${i}`,
                        triggerTimestamp: 0,
                        executionTime: 1, // 執行時間為3秒
                        priority: 10, // 初始優先度為10
                        isPeriodicTask: true, // 是週期性行程

                        ready_to_running_Check: (self: PCB, as: AlgorithmService) => {
                            if (!as.reLock.has(self.pid)) {
                                as.reLock.add(self.pid); // 設置鎖定狀態，防止重入
                            } else if (self.state == "Running") {
                                // 如果已經在執行狀態，則不進行檢查
                                return true; // 可以進入執行狀態
                            } else {
                                // 如果已經鎖定，則不進行檢查
                                return false; // 無法進入執行狀態
                            }

                            if (self.openFiles.size == 2) {
                                // 如果已經有兩個筷子被拿著，則可以進入執行狀態
                                return true; // 可以進入執行狀態
                            }
                            // 款子總數等於哲學家，檢查左右筷子是否可用(如果是最後一個哲學家，則檢查第一個筷子)
                            const leftChopstick = as.registry.get(`筷${i}`); // 左邊的筷子
                            const rightChopstick = as.registry.get(`筷${i == count ? 1 : i + 1}`); // 右邊的筷子

                            const leftAvailable = leftChopstick.available(); // 左邊筷子是否可用
                            const rightAvailable = rightChopstick.available(); // 右邊筷子是否可用

                            //如果左邊的筷子被自己拿著且右邊的筷子能用
                            if ((self.openFiles.has(leftChopstick.id)) && rightAvailable) {
                                rightChopstick.use(self); // 使用右邊筷子
                                // 將右邊筷子加入已開啟的檔案列表
                                self.openFiles.set(rightChopstick.id, rightChopstick);
                                return true; // 可以進入執行狀態
                            } else if ((self.openFiles.has(rightChopstick.id)) && leftAvailable) {
                                leftChopstick.use(self); // 使用左邊筷子
                                // 將左邊筷子加入已開啟的檔案列表
                                self.openFiles.set(leftChopstick.id, leftChopstick);
                                return true; // 可以進入執行狀態
                            } else if (leftAvailable) {
                                // 如果左邊筷子可用
                                self.openFiles.set(leftChopstick.id, leftChopstick); // 將左邊筷子加入已開啟的檔案列表
                                leftChopstick.use(self); // 使用左邊筷子
                                return false; // 無法進入執行狀態
                            } else if (rightAvailable) {
                                // 如果右邊筷子可用
                                self.openFiles.set(rightChopstick.id, rightChopstick);
                                rightChopstick.use(self); // 使用右邊筷子
                                return false; // 無法進入執行狀態
                            }
                            // 釋放所有筷子
                            self.openFiles.forEach((chopstick, key) => {
                                chopstick.release(); // 釋放筷子
                                self.openFiles.delete(key); // 從已開啟的檔案列表中移除筷子
                            });
                            return false; // 無法進入執行狀態
                        },
                        resource: function () {
                            return [
                                {
                                    id: `筷${i}`,
                                    ownerPid: `哲學家${i}`,
                                    userPid: "",
                                    available: function () {
                                        return this.userPid == "";
                                    },
                                    use: function (self: PCB) {
                                        this.userPid = self.pid; // 設定使用者 PID 為當前行程的 PID
                                    },
                                    release: function () {
                                        this.userPid = ""; // 釋放使用者 PID
                                    }
                                }
                            ]
                        },
                        triggerSetter: (cpuTime: number, self: PCB) => {
                            // 設定哲學家的觸發時間為核心時間加上隨機1~15個系統時間
                            const randomTime = Math.floor(Math.random() * 15) + 1;
                            self.isTimerActive = true; // 啟用定時器
                            self.triggerTimestamp = cpuTime + randomTime;
                            self.remainingTime = 1;
                            self.priority = 10;
                        }
                    });
                }
                return ps;
            },
            ps: []
        },
        {
            title: "銀行家演算法",
            baseResources: [
                {
                    id: "A",
                    type: "A",
                    Available: 3, // 資源 A 的總數量
                },
                {
                    id: "B",
                    type: "B",
                    Available: 3, // 資源 B 的總數量
                },
                {
                    id: "C",
                    type: "C",
                    Available: 2, // 資源 C 的總數量
                },
                {
                    id: "D",
                    type: "D",
                    Available: 1, // 資源 D 的總數量
                },
            ],
            readyQueues: [{ title: "備妥佇列", max_length: 10 }],
            makePs: function () {
                return this.ps;
            },
            ps: [
                {
                    pid: "P1",
                    triggerTimestamp: 0,
                    executionTime: 2,
                    resource: function () {
                        return [
                            {
                                id: "A-P1",
                                type: "A",
                                Allocation: 2,
                                Max: 4,
                                Need: 2
                            },
                            {
                                id: "B-P1",
                                type: "B",
                                Allocation: 0,
                                Max: 2,
                                Need: 2
                            },
                            {
                                id: "C-P1",
                                type: "C",
                                Allocation: 0,
                                Max: 1,
                                Need: 1
                            },
                            {
                                id: "D-P1",
                                type: "D",
                                Allocation: 1,
                                Max: 2,
                                Need: 1
                            },
                        ]
                    },
                },
                {
                    pid: "P2",
                    triggerTimestamp: 0,
                    executionTime: 2,
                    resource: function () {
                        return [
                            {
                                id: "A-P2",
                                type: "A",
                                Allocation: 3,
                                Max: 5,
                                Need: 2,
                            },
                            {
                                id: "B-P2",
                                type: "B",
                                Allocation: 1,
                                Max: 2,
                                Need: 1,
                            },
                            {
                                id: "C-P2",
                                type: "C",
                                Allocation: 2,
                                Max: 5,
                                Need: 3,
                            },
                            {
                                id: "D-P2",
                                type: "D",
                                Allocation: 1,
                                Max: 2,
                                Need: 1,
                            },
                        ]
                    },
                },
                {
                    pid: "P3",
                    triggerTimestamp: 0,
                    executionTime: 2,
                    resource: function () {
                        return [
                            {
                                id: "A-P3",
                                type: "A",
                                Allocation: 2,
                                Max: 2,
                                Need: 0,
                            },
                            {
                                id: "B-P3",
                                type: "B",
                                Allocation: 1,
                                Max: 3,
                                Need: 2,
                            },
                            {
                                id: "C-P3",
                                type: "C",
                                Allocation: 0,
                                Max: 1,
                                Need: 1,
                            },
                            {
                                id: "D-P3",
                                type: "D",
                                Allocation: 3,
                                Max: 6,
                                Need: 3,
                            },
                        ]
                    },
                },
                {
                    pid: "P4",
                    triggerTimestamp: 0,
                    executionTime: 2,
                    resource: function () {
                        return [
                            {
                                id: "A-P4",
                                type: "A",
                                Allocation: 1,
                                Max: 1,
                                Need: 0,
                            },
                            {
                                id: "B-P4",
                                type: "B",
                                Allocation: 3,
                                Max: 4,
                                Need: 1,
                            },
                            {
                                id: "C-P4",
                                type: "C",
                                Allocation: 1,
                                Max: 2,
                                Need: 1,
                            },
                            {
                                id: "D-P4",
                                type: "D",
                                Allocation: 2,
                                Max: 4,
                                Need: 2,
                            },
                        ]
                    },
                },
                {
                    pid: "P5",
                    triggerTimestamp: 0,
                    executionTime: 2,
                    resource: function () {
                        return [
                            {
                                id: "A-P5",
                                type: "A",
                                Allocation: 1,
                                Max: 3,
                                Need: 2,
                            },
                            {
                                id: "B-P5",
                                type: "B",
                                Allocation: 4,
                                Max: 6,
                                Need: 2,
                            },
                            {
                                id: "C-P5",
                                type: "C",
                                Allocation: 3,
                                Max: 6,
                                Need: 3,
                            },
                            {
                                id: "D-P5",
                                type: "D",
                                Allocation: 2,
                                Max: 5,
                                Need: 3,
                            },
                        ]
                    },
                },
            ]
        },
        {
            title: "期中考第一、二題",
            readyQueues: [{ title: "備妥佇列", max_length: 10 }],
            makePs: function () {
                return this.ps
            },
            ps: [
                {
                    pid: "A", triggerTimestamp: 0, executionTime: 5,
                },
                {
                    pid: "B", triggerTimestamp: 2, executionTime: 7
                },
                {
                    pid: "C", triggerTimestamp: 5, executionTime: 10
                },
                {
                    pid: "D", triggerTimestamp: 7, executionTime: 8
                },
                {
                    pid: "E", triggerTimestamp: 8, executionTime: 15
                },
                {
                    pid: "F", triggerTimestamp: 12, executionTime: 25
                },
                {
                    pid: "G", triggerTimestamp: 15, executionTime: 12
                },
            ]
        },
        {
            title: "期中考第三題",
            readyQueues: [{ title: "備妥佇列", max_length: 10 }],
            makePs: function () {
                return this.ps
            },
            ps: [
                {
                    pid: "A", triggerSetter: (cpuTime: number, self: PCB) => {
                    }, triggerTimestamp: 0, executionTime: 4
                },
                {
                    pid: "B", triggerSetter: (cpuTime: number, self: PCB) => {
                    }, triggerTimestamp: 2, executionTime: 9
                },
                {
                    pid: "C", triggerSetter: (cpuTime: number, self: PCB) => {
                    }, triggerTimestamp: 5, executionTime: 6
                },
                {
                    pid: "D", triggerSetter: (cpuTime: number, self: PCB) => {
                    }, triggerTimestamp: 10, executionTime: 12
                },
                {
                    pid: "E", triggerSetter: (cpuTime: number, self: PCB) => {
                    }, triggerTimestamp: 15, executionTime: 20
                },
            ]
        },
    ];