import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassesUpcomingComponent } from './classes-upcoming.component';

describe('ClassesUpcomingComponent', () => {
  let component: ClassesUpcomingComponent;
  let fixture: ComponentFixture<ClassesUpcomingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ClassesUpcomingComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClassesUpcomingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
