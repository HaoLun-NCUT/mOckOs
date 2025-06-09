import { Component } from '@angular/core';
import { AlgorithmService } from '../../system/queue/algorithm.service';
import { PCB } from '../../system/pcb/pcb.model';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { Queue } from '../../system/queue/queue.class';

@Component({
    selector: 'app-memery',
    imports: [CommonModule, CardModule],
    templateUrl: './memery.component.html',
    styles: [`
    :host {
        width: 100%;
        height: 100%;
        display:grid;
        grid-template-columns: repeat(2, 1fr);
            overflow: auto;
    } 

    div{
        border: 1px solid #ccc;
    }

    .queue-display{
        overflow-y: auto;
        align-items: center;
        height: 100%;
    }

    p-card {
        margin-bottom: 20px;
        --p-card-title-font-size: 1rem;
        --p-card-color:rgb(12, 65, 0);
        --p-card-body-gap: 0px;
        --p-card-body-padding: 0px;
        --p-card-caption-gap: 20px;
    }
  `
    ]
})
export class MemeryComponent {
    readyQueues!: Queue[];
    waitingQueue!: Queue;

    constructor(private algorithmService: AlgorithmService) { }

    ngOnInit(): void {
        // 將 AlgorithmService 中的佇列與執行空間綁定到本地屬性
        this.readyQueues = this.algorithmService.readyQueues;
        this.waitingQueue = this.algorithmService.waitingQueue;
    }
}