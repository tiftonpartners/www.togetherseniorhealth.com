import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { NgbModule, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';

import { CoreModule } from '@app/core';
import { SharedModule } from '@app/shared';
import { HomeModule } from './home/home.module';
import { ShellModule } from './shell/shell.module';
import { AboutModule } from './about/about.module';
import { LoginModule } from './login/login.module';
import { SessionsModule } from './session/sessions/sessions.module';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { AgoraGridComponent } from './session/agora-grid/agora-grid.component';
import { AgoraTestGridComponent } from './session/agora-test-grid/agora-test-grid.component';
import { AgoraStreamComponent } from './session/agora-stream/agora-stream.component';
import { RecbuttonComponent } from './session/recording/recbutton/recbutton.component';
import { DefaultDialogComponent } from '@app/shared/default-dialog/default-dialog.component';
import { environment } from '@env/environment';
import { ControlButtonComponent } from './shared/control-button/control-button.component';
import { VideoCheckModule } from './video-check/video-check.module';
import { TestStreamModule } from './test-stream/test-stream.module';
import { NotFoundModule } from './not-found/not-found.module';
import { MatSnackBarModule } from '@angular/material';
import { FormsModule } from '@angular/forms';
import { AgoraConfig } from './shared/services/agora/agora.config';
import { AgoraService } from './shared/services/agora/agora.service';

const agoraConfig: AgoraConfig = {
  AppID: environment.agoraAppId,
  Video: { codec: 'h264', mode: 'rtc', role: 'host' }
};

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    TranslateModule.forRoot(),
    NgbModule,
    NgbModalModule,
    CoreModule,
    SharedModule,
    ShellModule,
    HomeModule,
    AboutModule,
    LoginModule,
    SessionsModule,
    VideoCheckModule,
    TestStreamModule,
    NotFoundModule,
    MatSnackBarModule,
    AppRoutingModule // must be imported as the last module as it contains the fallback route
  ],
  declarations: [AppComponent, AgoraGridComponent, AgoraStreamComponent, AgoraTestGridComponent, RecbuttonComponent],
  providers: [AgoraService, { provide: 'config', useValue: agoraConfig }],
  bootstrap: [AppComponent],
  entryComponents: [DefaultDialogComponent, ControlButtonComponent]
})
export class AppModule {}
