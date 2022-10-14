import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AgoraTestGridComponent } from './agora-test-grid.component';

describe('AgoraComponent', () => {
  let component: AgoraTestGridComponent;
  let fixture: ComponentFixture<AgoraTestGridComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AgoraTestGridComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AgoraTestGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
