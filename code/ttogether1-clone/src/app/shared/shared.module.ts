import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DefaultDialogComponent } from './default-dialog/default-dialog.component';
import { LoaderComponent } from './loader/loader.component';
import { MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ControlButtonComponent } from './control-button/control-button.component';
import { TimeHeaderComponent } from './time-header/time-header.component';

@NgModule({
  imports: [CommonModule, MatDialogModule, BrowserAnimationsModule],
  declarations: [LoaderComponent, DefaultDialogComponent, ControlButtonComponent, TimeHeaderComponent],
  exports: [LoaderComponent, DefaultDialogComponent, ControlButtonComponent, TimeHeaderComponent]
})
export class SharedModule {}
