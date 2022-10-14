import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TestStreamComponent } from './test-stream.component';

describe('VideoCheckComponent', () => {
  let component: TestStreamComponent;
  let fixture: ComponentFixture<TestStreamComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TestStreamComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestStreamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
