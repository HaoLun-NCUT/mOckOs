import { CommonModule } from '@angular/common';
import { Component, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { SplitterModule, Splitter } from 'primeng/splitter';
import { FactoryComponent } from "./main/factory/factory.component";
import { MemeryComponent } from "./main/memery/memery.component";
import { GanttComponent } from "./main/gantt/gantt.component";
import { CpuComponent } from "./main/cpu/cpu.component";
import { PcbComponent } from './main/pcb/pcb.component';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [SplitterModule, FormsModule, CommonModule],
  templateUrl: './app.component.html',
})
export class AppComponent {

  //監聽分隔器(暫時沒用)
  @ViewChild('horizontal') horizontalSplitters!: Splitter;
  @ViewChildren('vertical') verticalSplitters!: QueryList<Splitter>;

  onchange(event: any) {
    console.log(123);
  }

  vStyle = {
    'width': 'fit - content',
    'height': '100vh',
    dev: {
      'width': 'fit - content',
      'height': '100 %',
      'background-Color': 'red',

    }
  }

  hStyle = {
    'height': '100%',
    'width': '100vw',
  }

  componentOBJs: any = {
    "FactoryComponent": FactoryComponent,
    "PcbComponent": PcbComponent,
    "MemeryComponent": MemeryComponent,
    "CpuComponent": CpuComponent,
    "GanttComponent": GanttComponent
  }

  panels = [
    {
      key: 'vkey-1',
      components: ['GanttComponent'],
      sizes: [100],  //垂直分隔器的比例
      minSizes: [10], //最小大小
    },
    {
      key: 'vkey-2',
      components: ['FactoryComponent', 'PcbComponent', 'MemeryComponent', 'CpuComponent'],
      sizes: [10, 50, 10, 30], //垂直分隔器的比例
      minSizes: [10, 10, 10, 10], //最小大小
    },
  ]
}
