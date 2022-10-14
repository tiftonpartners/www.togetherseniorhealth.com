import { NgModule } from '@angular/core';
import { extract, Logger } from '@app/core';
import { Routes, RouterModule } from '@angular/router';
import { ClassesUpcomingComponent } from '@app/session/classes-upcoming/classes-upcoming.component';
import { AgoraGridComponent } from '../agora-grid/agora-grid.component';
import { Shell } from '@app/shell/shell.service';
import { AgoraStreamComponent } from '../agora-stream/agora-stream.component';
import { AgoraTestGridComponent } from '../agora-test-grid/agora-test-grid.component';
import { SessionLeaveComponent } from '../session-leave/session-leave.component';

const log = new Logger('SessionsRouting');

const routes: Routes = [
  Shell.childRoutes([
    { path: 'session/leave/:acronym', component: SessionLeaveComponent, data: { title: extract('Leave Class') } },
    {
      path: 'session/upcoming/:ticket',
      component: ClassesUpcomingComponent,
      data: { title: extract('Moving Together') }
    },
    { path: 'session/upcoming', component: ClassesUpcomingComponent, data: { title: extract('Moving Together') } },
    { path: 'session/agora/grid', component: AgoraGridComponent, data: { title: extract('AGrid') } },
    { path: 'session/agora/grid/:name', component: AgoraGridComponent, data: { title: extract('AGrid') } },
    { path: 'session/agora/stream', component: AgoraStreamComponent, data: { title: extract('Test Stream') } },
    { path: 'session/agora/stream/:name', component: AgoraStreamComponent, data: { title: extract('Test Stream') } },
    { path: 'session/agora/group/:name', component: AgoraGridComponent, data: { title: extract('Classroom') } },
    { path: 'session/agora/group/', component: AgoraGridComponent, data: { title: extract('Instructor') } },
    { path: 'session/agora/instructor/:name', component: AgoraGridComponent, data: { title: extract('Instructor') } },
    { path: 'session/agora/instructor/', component: AgoraGridComponent, data: { title: extract('Instructor') } },
    { path: 'session/agora/testgrid/:name', component: AgoraTestGridComponent, data: { title: extract('Test Grid') } }
  ])
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SessionsRoutingModule {}
