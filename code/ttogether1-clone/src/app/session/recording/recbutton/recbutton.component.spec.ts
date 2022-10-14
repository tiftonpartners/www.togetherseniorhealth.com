import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RecbuttonComponent } from './recbutton.component';

describe('RecbuttonComponent', () => {
  let component: RecbuttonComponent;
  let fixture: ComponentFixture<RecbuttonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [RecbuttonComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RecbuttonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
