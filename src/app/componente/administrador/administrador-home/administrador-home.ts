import { Component } from '@angular/core';
import {Administrador} from '../../administrador-header/administrador';
import {AdministradorNavBar} from '../administrador-nav-bar/administrador-nav-bar';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';

@Component({
  selector: 'app-administrador-home',
  imports: [
    Administrador,
    AdministradorNavBar,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent
  ],
  templateUrl: './administrador-home.html',
  styleUrl: './administrador-home.css',
})
export class AdministradorHome {

}
