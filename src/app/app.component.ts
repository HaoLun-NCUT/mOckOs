import { CommonModule } from '@angular/common';
import { Component, QueryList, ViewChildren } from '@angular/core';
import { SplitterModule, Splitter, SplitterResizeEndEvent } from 'primeng/splitter';
import { FactoryComponent } from "./main/factory/factory.component";
import { MemeryComponent } from "./main/memery/memery.component";
import { GanttComponent } from "./main/gantt/gantt.component";
import { CpuComponent } from "./main/cpu/cpu.component";

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [CommonModule, SplitterModule, FactoryComponent, MemeryComponent, GanttComponent, CpuComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  //監聽分隔器(暫時沒用)
  @ViewChildren('horizontal') horizontalSplitters!: QueryList<Splitter>;
  @ViewChildren('vertical') verticalSplitters!: QueryList<Splitter>;

  horizontalStyle = {
    height: '100vh',
    width: '100vw',
  }

  panels: any = [
    {
      key: 'vkey-1',
      components: [FactoryComponent, MemeryComponent]
    },
    {
      key: 'vkey-2',
      components: [GanttComponent, CpuComponent]
    }
  ]

  hSize = [50, 50]; //水平分隔器的比例
  vSize = [50, 50]; //垂直分隔器的比例

}