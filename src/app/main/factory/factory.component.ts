import { PcbService } from './../pcb/pcb.service';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { AlgorithmService } from '../../common/algorithm.service';
@Component({
  selector: 'app-factory',
  imports: [FormsModule, DropdownModule],
  templateUrl: './factory.component.html',
  styles: [`
   :host {
    width: 100%;
    height: 100%;
  }`
  ]
})
export class FactoryComponent {
  pcbService = inject(PcbService);
  algorithmService = inject(AlgorithmService);

  options = [
    { label: '第一、二題', value: 0 },
    { label: '第三題', value: 1 }
  ]; // 選單選項

  selectedValue: any // 預設選中的值
  // 當選擇改變時觸發
  onSelectionChange(): void {
    this.pcbService.currentTable = this.selectedValue.value; // 更新資料流的值
    this.pcbService.initializeTables(); // 初始化行程資料
  }

}
