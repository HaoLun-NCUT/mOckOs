import { Component, inject } from '@angular/core';
import { PCB } from './pcb.model';
import { PcbService } from './pcb.service';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-pcb',
  standalone: true,
  imports: [FormsModule, TableModule, InputTextModule, CommonModule],
  templateUrl: './pcb.component.html',
  styles: [`
  .table {
    width: 100%;
    left: 0px;
    top: 0px;
    right: 0px;
    bottom: 0px;
    position: absolute;
  }`, `
  tr .p-datatable-frozen-column {  
    background-color:rgba(0, 0, 0, 0); /* 奇数行 */  
  }  `, `
  th {  
    background-color:rgb(113, 50, 50);/* 奇数行 */    
  }  `, `
  tr:nth-child(odd) {  
    background-color: #ffffff;/* 奇数行 */    
  }  `, `
  tr:nth-child(even){  
    background-color:rgba(180, 218, 222, 0.32);  /* 偶数行 */
  }  
  `,
    ` :host {
    width:100%;
    height:100%;
    position: relative;  
    background-color: #f5f5f5;
    padding: 10px;
    border: 1px solid #ccc;
}
    `]
})
export class PcbComponent {
  table1: PCB[] = [];
  table2: PCB[] = [];
  private subscriptions: Subscription[] = [];
  private pcbService = inject(PcbService)

  ngOnInit(): void {
    // 訂閱 Table1 資料流
    this.subscriptions.push(
      this.pcbService.getTable1Stream().subscribe((data) => {
        this.table1 = data;
      })
    );

    // 訂閱 Table2 資料流
    this.subscriptions.push(
      this.pcbService.getTable2Stream().subscribe((data) => {
        this.table2 = data;
      })
    );
  }

  ngOnDestroy(): void {
    // 取消所有訂閱
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}