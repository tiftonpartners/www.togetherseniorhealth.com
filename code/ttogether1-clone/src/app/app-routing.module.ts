import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  // Fallback when no prior route is matched
  { path: '**', redirectTo: '/404' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes /*, { enableTracing: true } */)],
  exports: [RouterModule],
  providers: []
})
export class AppRoutingModule {}
