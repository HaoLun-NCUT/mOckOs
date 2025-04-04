import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemeryComponent } from './memery.component';

describe('MemeryComponent', () => {
  let component: MemeryComponent;
  let fixture: ComponentFixture<MemeryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemeryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MemeryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
