import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotFoundComponent } from './not-found.component';
import { TranslateModule } from '@ngx-translate/core';
import { NotFoundRoutingModule } from './not-found-routing.module';
import { SharedModule } from '@app/shared';
import { SessionsModule } from '@app/session/sessions/sessions.module';

@NgModule({
  imports: [CommonModule, TranslateModule, NotFoundRoutingModule, SharedModule, SessionsModule],
  declarations: [NotFoundComponent]
})
export class NotFoundModule {}
