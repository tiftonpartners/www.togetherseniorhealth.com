import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { SessionsRoutingModule } from './sessions-routing.module';
import { SessionVideoComponent } from '../session-video/session-video.component';
import { ClassesUpcomingComponent } from '@app/session/classes-upcoming/classes-upcoming.component';
import { SharedModule } from '@app/shared';
import { TranslateModule } from '@ngx-translate/core';
import { SessionLeaveComponent } from '../session-leave/session-leave.component';
import { MatDialogModule } from '@angular/material/dialog';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { AgoraVideoPlayerDirective } from '@app/shared/directives/agora-video-player.directive';
import { SoundVisualizerComponent } from '../sound-visualizer/sound-visualizer/sound-visualizer.component';
@NgModule({
  imports: [
    BrowserModule,
    CommonModule,
    HttpClientModule,
    SessionsRoutingModule,
    SharedModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    NgbModule
  ],
  declarations: [
    SessionLeaveComponent,
    ClassesUpcomingComponent,
    SessionVideoComponent,
    AgoraVideoPlayerDirective,
    SoundVisualizerComponent
  ],
  exports: [SessionVideoComponent],
  entryComponents: []
})
export class SessionsModule {}
