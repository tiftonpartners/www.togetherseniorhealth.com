import { Component, OnInit } from '@angular/core';
import { Logger } from '@app/core/logger.service';

const log = new Logger('ShellComponent');

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss']
})
export class ShellComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
