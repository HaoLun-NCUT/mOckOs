import { PcbService } from '../../system/pcb/pcb.service';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { AlgorithmService } from '../../system/queue/algorithm.service';
import { processTables } from '../../system/pcb/pcb-process';
import { CpuService } from '../../system/cpu/cpu.service';
import { CardModule } from 'primeng/card';
import { PCB } from '../../system/pcb/pcb.model';
@Component({
    selector: 'app-factory',
    imports: [FormsModule, DropdownModule, CardModule],
    templateUrl: './factory.component.html',
    styles: [`
   :host {
    width: 100%;
    height: 100%;
    overflow: auto;
  }
    th,td{
        border: solid black 1px;
    }
  `
    ]
})

export class FactoryComponent {
    pcbService = inject(PcbService);
    algorithmService = inject(AlgorithmService);
    cpuService = inject(CpuService);

    showRegistryTable = false//是否顯示資源表
    registry!: any[]; // 資源庫
    baseRegistry!: any[]; // 基礎資源庫

    //安全序列
    safeSequences: string[] = [];

    options!: { label: string, value: number }[]; // 選單選項

    ngOnInit(): void {
        this.options = this.processTables(processTables); // 處理 PCB 資料表並生成選項
        this.selectedValue = this.options[0]; // 預設選中第一個選項
        this.cpuService.getTimeStream().subscribe(
            (kernelTime) => {
                this.registry = Array.from(this.algorithmService.registry.values());

                this.baseRegistry = Array.from(this.algorithmService.baseRegistry.values());
                this.showRegistryTable = this.baseRegistry.length > 0; // 如果基礎資源庫有資料則顯示資源表
                this.safeSequences = this.algorithmService.safeSequences.map(p => {
                    return p.map((pcb: PCB) => {
                        return pcb.pid;
                    }).join("->");
                })

            }
        );

    }




    // 這是一個輔助函式，用於在模板中取得物件的所有鍵
    objectKeys(obj: any): string[] {
        return Object.keys(obj);
    }


    selectedValue: any // 預設選中的值
    // 當選擇改變時觸發
    onSelectionChange(): void {
        this.pcbService.currentTable = this.selectedValue.value; // 更新資料流的值
        this.pcbService.initializeTables(); // 初始化行程資料
        this.cpuService.stop // 初始化 CPU 狀態
    }

    processTables(processTables: any[]): { label: string, value: number }[] {
        return processTables.map((table, index) => {
            return { label: table.title, value: index };
        });
    }

    //疊加資源庫的Available
    totle(ava: number, index: number, id: string) {
        let total = ava;
        for (let i = index; i > 0; i--) {
            let ppb = this.algorithmService.safeSequences[this.algorithmService.random][i]
            total += ppb.resource.get(`${id}-${ppb.pid}`).Allocation;
        }
        return total;
    }



}
