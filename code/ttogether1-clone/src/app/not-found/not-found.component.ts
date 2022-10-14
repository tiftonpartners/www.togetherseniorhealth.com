import { Component, OnInit } from '@angular/core';
import { CredentialsService } from '@app/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss']
})
export class NotFoundComponent implements OnInit {
  nickname: string;

  constructor(private router: Router, private credentilsService: CredentialsService) {}

  ngOnInit() {
    this.credentilsService.onPermissionsReady$.subscribe(() => {
      const credentials = this.credentilsService.credentials;
      this.nickname = credentials.nickname;
    });
  }

  tryAgain() {
    this.router.navigate(['/']);
  }

  askForHelp() {}
}
