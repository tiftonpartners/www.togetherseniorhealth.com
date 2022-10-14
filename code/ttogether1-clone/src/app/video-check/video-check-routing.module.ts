import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { extract } from '@app/core';
import { Shell } from '@app/shell/shell.service';
import { VideoCheckComponent } from './video-check.component';

const routes: Routes = [
  Shell.childRoutes([{ path: 'check', component: VideoCheckComponent, data: { title: extract('VideoCheck') } }])
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: []
})
export class VideoCheckRoutingModule {}
