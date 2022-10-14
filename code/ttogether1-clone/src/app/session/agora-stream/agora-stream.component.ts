import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { SessionStateService } from '@ses/sessions/session-state.service';
import { Logger, CredentialsService } from '@app/core';
import { AgoraAbstractComponent } from '../agora/agora-abstract';
import { GlobalEventService } from '@app/evnt/global-events.service';
import { SessionApiService } from '../sessions/session-api.service';
import { UserApiService } from '@app/core/authentication/user-api.service';
import { MatDialog } from '@angular/material/dialog';
import { EClientView } from '@app/shared/interfaces';
import { MatSnackBar } from '@angular/material';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MusicApiService } from '../sessions/music-api-service';
import { MediaService } from '@app/shared/services/media/media.service';
import { AgoraService } from '@app/shared/services/agora/agora.service';
import { AnalyticsService } from '@app/analytics/analytics.service';

const log = new Logger('AgoraStreamComponent');
// create client instances for camera (client) and screen share (screenClient)

@Component({
  selector: 'app-agora-stream',
  templateUrl: './agora-stream.component.html',
  styleUrls: ['./agora-stream.component.scss']
})
export class AgoraStreamComponent extends AgoraAbstractComponent implements OnInit, OnDestroy {
  constructor(
    sessionApiService: SessionApiService,
    sessionStateService: SessionStateService,
    credentialService: CredentialsService,
    router: Router,
    activatedRoute: ActivatedRoute,
    globalEventService: GlobalEventService,
    userApiService: UserApiService,
    musicApiService: MusicApiService,
    snackBar: MatSnackBar,
    modalService: NgbModal,
    dialog: MatDialog,
    mediaService: MediaService,
    agoraService: AgoraService,
    analyticsService: AnalyticsService
  ) {
    super(
      sessionApiService,
      sessionStateService,
      credentialService,
      router,
      activatedRoute,
      globalEventService,
      userApiService,
      musicApiService,
      snackBar,
      modalService,
      dialog,
      mediaService,
      agoraService,
      analyticsService
    );
  }

  async ngOnInit() {
    super.ngOnInit();
    this.sessionStateService.setView(EClientView.STREAM);
  }

  async ngOnDestroy() {
    super.ngOnInit();
  }
}
