import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoCheckComponent } from './video-check.component';
import { TranslateModule } from '@ngx-translate/core';
import { VideoCheckRoutingModule } from './video-check-routing.module';
import { SharedModule } from '@app/shared';
import { SessionsModule } from '@app/session/sessions/sessions.module';

@NgModule({
  declarations: [VideoCheckComponent],
  imports: [CommonModule, TranslateModule, VideoCheckRoutingModule, SharedModule, SessionsModule]
})
export class VideoCheckModule {}
