import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface DefaultDialogData {
  title: string;
  message: string;
  leaveButton?: string;
  endButton?: string;
  cancelButton?: string;
}

@Component({
  selector: 'app-default-dialog',
  templateUrl: './default-dialog.component.html',
  styleUrls: ['./default-dialog.component.scss']
})
export class DefaultDialogComponent implements OnInit {
  constructor(@Inject(MAT_DIALOG_DATA) public data: DefaultDialogData) {}

  ngOnInit() {}
}
