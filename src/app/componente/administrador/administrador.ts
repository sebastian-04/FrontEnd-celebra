import {Component, inject} from '@angular/core';
import {TitleCasePipe} from '@angular/common';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidatorFn, Validators} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {MatToolbarModule } from '@angular/material/toolbar';
import {MatFormFieldModule } from '@angular/material/form-field';
import {MatSelectModule } from '@angular/material/select';
import {MatInputModule } from '@angular/material/input';
import {MatButtonModule } from '@angular/material/button';
import {MatCardModule } from '@angular/material/card';
import {MatTableModule } from '@angular/material/table';
import {MatSnackBar} from '@angular/material/snack-bar';
import {CiudadServices} from '../../services/ciudad-services';
import {DistritoServices} from '../../services/distrito-services';
import {EspecializacionServices} from '../../services/especializacion-services';
import {TipoEventoServices} from '../../services/tipo-evento-services';
import {HttpErrorResponse} from '@angular/common/http';


@Component({
  selector: 'app-administrador',
  imports: [
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    TitleCasePipe,
    FormsModule,
    ReactiveFormsModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatTableModule,
  ],
  templateUrl: './administrador.html',
  styleUrl: './administrador.css',
})
export class Administrador {
  formulario!: FormGroup;
  entidadSeleccionada: string = '';
  accionSeleccionada: string = '';
  mostrarCerrarSesion = false;
  animando = false;
  menuActivo = false;
  menuPerfilActivo = false;
  columnasVisibles: string[] = [];
  listaDatos: any[] = [];
  private fb: FormBuilder = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  private ciudadService = inject(CiudadServices);
  private distritoService = inject(DistritoServices);
  private especializacionService = inject(EspecializacionServices);
  private tipoEventoService = inject(TipoEventoServices);

  constructor() {
    this.formulario = this.fb.group({});
    this.entidadSeleccionada = 'especializacion';
    this.accionSeleccionada = 'listar';
    this.actualizarFormulario();
    this.listarDatos();
  }

  actualizarFormulario() {
    this.formulario = this.fb.group({});
    this.camposVisibles.forEach((campo) => {
      let validadores: ValidatorFn[] = [];
      if (
        (this.accionSeleccionada === 'añadir' || this.accionSeleccionada === 'modificar') &&
        (campo.control === 'nombre' || campo.control === 'ciudadId')
      ) {
        validadores = [Validators.required];
      }
      this.formulario.addControl(campo.control, this.fb.control('', validadores));
    });
  }

  obtenerServicio() {
    switch (this.entidadSeleccionada) {
      case 'ciudad':
        return this.ciudadService;
      case 'distrito':
        return this.distritoService;
      case 'especializacion':
        return this.especializacionService;
      case 'tipoEvento':
        return this.tipoEventoService;
      default:
        return null;
    }
  }

  ejecutarAccion() {
    const servicio = this.obtenerServicio();
    if (!servicio) return;

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.snackBar.open('Complete todos los campos requeridos', 'Cerrar', { duration: 3000 });
      return;
    }

    let valores = this.formulario.value;

    if (this.entidadSeleccionada === 'distrito' && valores.ciudadId) {
      valores = {
        ...valores,
        ciudad: { id: valores.ciudadId }
      };
      delete valores.ciudadId;
    }

    console.log('Valores enviados al backend:', valores);

    let peticion;

    switch (this.accionSeleccionada) {
      case 'añadir':
        peticion = servicio.insert(valores);
        break;
      case 'modificar':
        peticion = servicio.modify(valores);
        break;
      case 'eliminar':
        peticion = servicio.delete(valores.id);
        break;
      default:
        return;
    }

    peticion.subscribe({
      next: () => {
        this.snackBar.open(
          `${this.entidadSeleccionada} ${this.accionSeleccionada} correctamente`,
          'Cerrar',
          { duration: 3000 }
        );
        this.formulario.reset();
        this.listarDatos();
        this.accionSeleccionada = 'listar';
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error en petición:', err);
        this.snackBar.open(
          `Error al ${this.accionSeleccionada} ${this.entidadSeleccionada}`,
          'Cerrar',
          { duration: 3000 }
        );
      },
    });
  }

  listarDatos() {
    const servicio = this.obtenerServicio();
    if (!servicio) return;

    servicio.listar().subscribe({
      next: (data: any[]) => {
        this.listaDatos = data;
        this.columnasVisibles =
          this.entidadSeleccionada === 'distrito'
            ? ['id', 'nombre', 'ciudad']
            : ['id', 'nombre'];
      },
      error: (err) => console.error(err),
    });
  }

  onEntidadChange() {
    setTimeout(() => {
      this.actualizarFormulario();
      this.listarDatos();
    });
  }
  onAccionChange() {
    setTimeout(() => {
      this.actualizarFormulario();
      if (this.accionSeleccionada === 'listar') this.listarDatos();
    });
  }
  get camposVisibles() {
    const campos: { label: string; control: string; type?: string }[] = [];
    const pideId = this.accionSeleccionada === 'modificar' || this.accionSeleccionada === 'eliminar';
    const soloId = this.accionSeleccionada === 'eliminar';
    if (soloId) {
      campos.push({ label: 'ID', control: 'id', type: 'number' });
      return campos;
    }
    if (pideId) campos.push({ label: 'ID', control: 'id', type: 'number' });
    campos.push({ label: 'Nombre', control: 'nombre' });
    if (this.entidadSeleccionada === 'distrito') {
      campos.push({ label: 'Ciudad ID', control: 'ciudadId', type: 'number' });
    }
    return campos;
  }

  cerrarSesion() {
    this.mostrarCerrarSesion = false;
  }

  confirmarCerrarSesion(event: MouseEvent) {
    event.stopPropagation();
    this.mostrarCerrarSesion = false;
    document.body.classList.remove('modal-abierto');
  }

  cancelarCerrarSesion(event: MouseEvent) {
    event.stopPropagation();
    this.mostrarCerrarSesion = false;
    document.body.classList.remove('modal-abierto');
  }

  abrirModalCerrarSesion() {
    this.mostrarCerrarSesion = true;
    document.body.classList.add('modal-abierto');
  }
  toggleMenuPerfil() {
    if (this.animando) return;
    this.animando = true;
    const menuPerfil = document.querySelector('.encabezado-perfil-menu');
    const overlay = document.querySelector('.overlay-buscar-avanzada');
    const menuHamb = document.querySelector('.menu-hamburguesa-text');
    const botonHamb = document.querySelector('.menu-hamburguesa-boton');
    if (this.menuActivo && menuHamb && botonHamb) {
      this.cerrarMenu(menuHamb, botonHamb);
    }
    if (!this.menuPerfilActivo) {
      menuPerfil?.classList.remove('saliendo');
      menuPerfil?.classList.add('activo');
      this.menuPerfilActivo = true;
    } else {
      menuPerfil?.classList.remove('activo');
      menuPerfil?.classList.add('saliendo');
      this.menuPerfilActivo = false;
    }
    setTimeout(() => (this.animando = false), 600);
  }
  cerrarMenu(menu: Element, boton: Element) {
    menu.classList.remove('activo');
    menu.classList.add('saliendo');
    boton.classList.remove('activo');
    this.menuActivo = false;
  }
}
