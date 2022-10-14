import { OnInit, OnDestroy, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * Class to add a body class in order to perform some styles
 *
 * @export
 */
export class BodyClassComponent implements OnInit, OnDestroy {
  bodyClass = '';

  constructor(@Inject(DOCUMENT) public document: Document) {}

  ngOnInit() {
    this.document.body.classList.add(this.bodyClass);
  }

  ngOnDestroy() {
    this.document.body.classList.remove(this.bodyClass);
  }
}
