import { Component, OnInit } from '@angular/core';
import { environment } from '@env/environment';
import { Logger } from '@app/core/logger.service';

const log = new Logger('AboutComponent');

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit {
  version: string | null = environment.version;
  apiServerPrefix = environment.apiServerPrefix;
  timeStamp = environment.timeStamp;
  websocketServerPrefix = environment.websocketServerPrefix;
  constructor() {
    log.debug('Environment:', JSON.stringify(environment, null, 2));
  }

  ngOnInit() {}
}
