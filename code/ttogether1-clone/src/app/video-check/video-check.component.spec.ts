import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoCheckComponent } from './video-check.component';

describe('VideoCheckComponent', () => {
  let component: VideoCheckComponent;
  let fixture: ComponentFixture<VideoCheckComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [VideoCheckComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VideoCheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
