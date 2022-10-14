import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { extract } from '@app/core';
import { Shell } from '@app/shell/shell.service';
import { TestStreamComponent } from './test-stream.component';

const routes: Routes = [
  Shell.childRoutes([{ path: 'stream/:name', component: TestStreamComponent, data: { title: extract('Test Stream') } }])
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: []
})
export class TestStreamRoutingModule {}
