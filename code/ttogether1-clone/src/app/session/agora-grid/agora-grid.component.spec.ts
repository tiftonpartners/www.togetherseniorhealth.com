import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AgoraGridComponent } from './agora-grid.component';

describe('AgoraComponent', () => {
  let component: AgoraGridComponent;
  let fixture: ComponentFixture<AgoraGridComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AgoraGridComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AgoraGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
