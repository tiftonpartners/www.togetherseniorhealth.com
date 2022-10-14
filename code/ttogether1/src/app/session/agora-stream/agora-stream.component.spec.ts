import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AgoraStreamComponent } from './agora-stream.component';

describe('AgoraStreamComponent', () => {
  let component: AgoraStreamComponent;
  let fixture: ComponentFixture<AgoraStreamComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AgoraStreamComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AgoraStreamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
