import { Component, OnInit, Input, Output, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'control-button',
  templateUrl: './control-button.component.html',
  styleUrls: ['./control-button.component.scss']
})
export class ControlButtonComponent implements OnInit {
  @Input() icon: string;
  @Input() toggleIcon: string;
  @Input() toggle = false;
  @Input() active = false;
  @Input() textWrap = false;
  @Input() hideText = false;
  @Input() round = false;
  @Input() small = false;

  constructor(public element: ElementRef) {}

  ngOnInit() {}
}
