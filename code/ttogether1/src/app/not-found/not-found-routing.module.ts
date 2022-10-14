import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { extract } from '@app/core';
import { NotFoundComponent } from './not-found.component';

const routes: Routes = [{ path: '404', component: NotFoundComponent, data: { title: extract('404') } }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: []
})
export class NotFoundRoutingModule {}
