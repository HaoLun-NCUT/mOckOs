import { CommonModule } from '@angular/common';
import { Component, HostListener, QueryList, ViewChildren } from '@angular/core';
import { SplitterModule, Splitter } from 'primeng/splitter';
import { FactoryComponent } from "./main/factory/factory.component";
import { MemeryComponent } from "./main/memery/memery.component";
import { GanttComponent } from "./main/gantt/gantt.component";
import { CpuComponent } from "./main/cpu/cpu.component";
import { PcbComponent } from './main/pcb/pcb.component';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [CommonModule, SplitterModule],
  templateUrl: './app.component.html',
  styles: `

  `
})
export class AppComponent {
  //監聽分隔器(暫時沒用)
  @ViewChildren('horizontal') horizontalSplitters!: QueryList<Splitter>;
  @ViewChildren('vertical') verticalSplitters!: QueryList<Splitter>;

  vStyle = {
    'width': 'fit - content',
    'height': '100 %',
    dev: {
      'width': 'fit - content',
      'height': '100 %',
      'background-Color': 'red',

    }
  }
  realPanel = {
    'width': 'fit - content',
    'height': '100 %',
    'background-Color': 'red',
  }

  hStyle = {
    'height': '100vh',
    'width': '100vw',
  }

  panels = [
    {
      key: 'vkey-1',
      components: [FactoryComponent, PcbComponent, MemeryComponent],
      sizes: [30, 40, 30], //垂直分隔器的比例
      minSizes: [20, 20, 20], //最小大小
    },
    {
      key: 'vkey-2',
      components: [GanttComponent, CpuComponent],
      sizes: [50, 50],  //垂直分隔器的比例
      minSizes: [20, 20], //最小大小
    }
  ]
}
