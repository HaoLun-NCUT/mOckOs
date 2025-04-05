import { Component } from '@angular/core';

@Component({
  selector: 'app-memery',
  imports: [],
  templateUrl: './memery.component.html',
  styles: [`
   :host {
    width: 100%;
    height: 100%;
    background: url('public/work-in-progress.png') no-repeat center center; /* 背景圖片 */
    background-size: auto 50%; /* 縮小背景圖片 */
    background-blend-mode: multiply; /* 混合模式，讓圖片與半透明背景結合 */
    filter: opacity(50%); /* 設置圖片透明度為 50% */
  }`
  ]
})
export class MemeryComponent {

}
