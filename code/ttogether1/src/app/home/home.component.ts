import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Logger } from '@app/core';
import { Auth0Service } from '@app/core/authentication/auth0.service';

const log = new Logger('HomeComponent');

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  isLoading = false;

  constructor(private router: Router, private activatedRoute: ActivatedRoute, private auth0Service: Auth0Service) {}

  ngOnInit() {
    const { username, password, redirectTo } = this.activatedRoute.snapshot.queryParams;
    this.isLoading = false;
  }
}
