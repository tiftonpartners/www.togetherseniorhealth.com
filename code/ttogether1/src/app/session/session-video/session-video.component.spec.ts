import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionVideoComponent } from './session-video.component';

describe('SessionVideoComponent', () => {
  let component: SessionVideoComponent;
  let fixture: ComponentFixture<SessionVideoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SessionVideoComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SessionVideoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
