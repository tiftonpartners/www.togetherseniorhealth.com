import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ControlButtonComponent } from './control-button.component';

describe('ControlButtonComponent', () => {
  let component: ControlButtonComponent;
  let fixture: ComponentFixture<ControlButtonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ControlButtonComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ControlButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
