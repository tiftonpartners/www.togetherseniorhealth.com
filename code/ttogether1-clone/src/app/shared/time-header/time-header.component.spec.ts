import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeHeaderComponent } from './time-header.component';

describe('TimeHeaderComponent', () => {
  let component: TimeHeaderComponent;
  let fixture: ComponentFixture<TimeHeaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TimeHeaderComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimeHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
