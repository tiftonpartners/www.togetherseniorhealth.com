import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { merge } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';

import { environment } from '@env/environment';
import { Logger, I18nService, untilDestroyed } from '@app/core';
import { GA, GAEvent } from './evnt/ga-events';
import { AnalyticsService } from './analytics/analytics.service';

declare const gtag: Function;

const log = new Logger('AppComponent');

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private titleService: Title,
    private translateService: TranslateService,
    private i18nService: I18nService,
    private analyticsService: AnalyticsService
  ) {
    if (environment.enableGA) {
      this.addGAScript();
    }

    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((event: NavigationEnd) => {
      /** START : Code to Track Page View  */
      if (environment.enableGA) {
        gtag(GA.EVENT, GAEvent.page_view.action, { page_path: event.urlAfterRedirects });
      }
      /** END */
    });
  }

  ngOnInit() {
    // Setup logger
    if (environment.production) {
      // Logger.enableProductionMode();
    }

    // log.debug('(ngOnInit) calling auth0Service.handleAuthCallback')
    // this.auth0Service.handleAuthCallback()
    /*      this.router.events.subscribe((event) => {
      log.debug('RouterEvent:', event)
    })
    */
    // Setup translations
    this.i18nService.init(environment.defaultLanguage, environment.supportedLanguages);

    const onNavigationEnd = this.router.events.pipe(filter(event => event instanceof NavigationEnd));

    // Change page title on navigation or language change, based on route data
    merge(this.translateService.onLangChange, onNavigationEnd)
      .pipe(
        map(() => {
          let route = this.activatedRoute;
          while (route.firstChild) {
            route = route.firstChild;
          }
          return route;
        }),
        filter(route => route.outlet === 'primary'),
        switchMap(route => route.data),
        untilDestroyed(this)
      )
      .subscribe(event => {
        const title = event.title;
        if (title) {
          this.titleService.setTitle(this.translateService.instant(title));
        }
      });
  }

  /** Add Google Analytics Script Dynamically */
  addGAScript() {
    let gtagScript: HTMLScriptElement = document.createElement('script');
    gtagScript.async = true;
    gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + environment.googleAnalyticsId;
    document.head.prepend(gtagScript);

    this.analyticsService.initialize();
  }

  ngOnDestroy() {
    this.i18nService.destroy();
  }
}
