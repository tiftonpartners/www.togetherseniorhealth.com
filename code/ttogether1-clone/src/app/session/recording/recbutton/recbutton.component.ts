import { Component, OnInit } from '@angular/core';
import { GlobalEventService } from '@app/evnt/global-events.service';

@Component({
  selector: 'recbutton',
  templateUrl: './recbutton.component.html',
  styleUrls: ['./recbutton.component.scss']
})
export class RecbuttonComponent implements OnInit {
  recording = false;
  constructor(private globalEventService: GlobalEventService) {}

  ngOnInit() {}
}
