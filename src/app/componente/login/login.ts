import {Component, inject, signal} from '@angular/core';
import {Router, RouterLink, RouterModule, RouterOutlet} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {AnfitrionServices} from '../../services/anfitrion-services';
import {ProveedorServices} from '../../services/proveedor-services';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  nombre: String = "Conviertete en un anfitrión";
  email: string = '';
  contrasena: string = '';
  anfitrionService: AnfitrionServices = inject(AnfitrionServices);
  proveedorService: ProveedorServices = inject(ProveedorServices);
  router: Router = inject(Router);
  correoAdministrador: string = 'admin@admin.com';
  contrasenaAdministrador: string = 'admin';
  constructor() {}
  login() {
    if (this.email === this.correoAdministrador && this.contrasena === this.contrasenaAdministrador) {
      this.router.navigate(['/administrador']);
      return;
    }
    this.anfitrionService.listar().subscribe({
      next: (anfitriones) => {
        console.log('Anfitriones desde backend:', anfitriones);
        console.log('Email ingresado:', this.email);
        console.log('Contraseña ingresada:', this.contrasena);
        const usuarioAnfitrion = anfitriones.find(a =>
          a.email.trim() === this.email.trim() && a.contrasena.trim() === this.contrasena.trim()
        );
        if (usuarioAnfitrion) {
          this.router.navigate([`/menu-anfitrion/${usuarioAnfitrion.id}`]);
          return;
        }
        this.proveedorService.listar().subscribe({
          next: (proveedores) => {
            const usuarioProveedor = proveedores.find(p =>
              p.email.trim() === this.email.trim() && p.contrasena.trim() === this.contrasena.trim()
            );
            if (usuarioProveedor) {
              this.router.navigate([`/menu-proveedor/${usuarioProveedor.id}`]);
            } else {
              alert('Email o contraseña incorrectos');
            }
          },
          error: (err) => {
            console.error(err);
            alert('Error al obtener los proveedores');
          }
        });
      },
      error: (err) => {
        console.error(err);
        alert('Error al obtener los anfitriones');
      }
    });
  }
}
