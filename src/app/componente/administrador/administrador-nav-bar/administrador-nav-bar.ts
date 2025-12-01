import { Component } from '@angular/core';
import {MatToolbar, MatToolbarRow} from '@angular/material/toolbar';
import {MatButton} from '@angular/material/button';
import {RouterLink, RouterLinkActive} from '@angular/router';

@Component({
  selector: 'app-administrador-nav-bar',
  imports: [
    MatToolbar,
    MatToolbarRow,
    MatButton,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './administrador-nav-bar.html',
  styleUrl: './administrador-nav-bar.css',
})
export class AdministradorNavBar {

}
