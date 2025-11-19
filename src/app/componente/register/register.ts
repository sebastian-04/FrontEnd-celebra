import { Component, signal } from '@angular/core';
import {RouterLink, RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [
    RouterLink

  ],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
    nombre: String = "Iniciar Sesión";
}
