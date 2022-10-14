import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TestStreamComponent } from './test-stream.component';
import { TranslateModule } from '@ngx-translate/core';
import { TestStreamRoutingModule } from './test-stream-routing.module';
import { SharedModule } from '@app/shared';
import { SessionsModule } from '@app/session/sessions/sessions.module';

@NgModule({
  declarations: [TestStreamComponent],
  imports: [CommonModule, TranslateModule, TestStreamRoutingModule, SharedModule, SessionsModule]
})
export class TestStreamModule {}
