import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionLeaveComponent } from './session-leave.component';

describe('SessionLeaveComponent', () => {
  let component: SessionLeaveComponent;
  let fixture: ComponentFixture<SessionLeaveComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SessionLeaveComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SessionLeaveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
