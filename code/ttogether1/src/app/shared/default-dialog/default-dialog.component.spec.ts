import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DefaultDialogComponent } from './default-dialog.component';

describe('LoaderComponent', () => {
  let component: DefaultDialogComponent;
  let fixture: ComponentFixture<DefaultDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DefaultDialogComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DefaultDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
});
