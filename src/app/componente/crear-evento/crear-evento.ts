import {ChangeDetectorRef, Component, ElementRef, HostListener, inject, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {Proveedor} from '../../model/proveedor';
import {ProveedorServices} from '../../services/proveedor-services';
import {CalendarComponent} from '../calendario/calendar';
import {Evento} from '../../model/evento';
import {EventoService} from '../../services/evento-services';
import {ImagenEvento} from '../../model/imagenEvento';
import {ImagenEventoService} from '../../services/imagenEvento-services';

@Component({
  selector: 'app-crear-evento',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    CalendarComponent,
  ],
  templateUrl: './crear-evento.html',
  styleUrl: './crear-evento.css',
})
export class CrearEvento {
  proveedor: Proveedor;
  crearForm: FormGroup;
  mostrarFiltrosAvanzados = false;
  menuPerfilActivo = false;
  menuActivo = false;
  animando = false;
  mostrarCerrarSesion = false;
  previewUrl: string | ArrayBuffer | null = null;
  selectedFileBase64: string | null = null;
  evento: Evento[] = [];
  imagenEvento: ImagenEvento[] = [];
  imagenEventoService = inject(ImagenEventoService);
  eventoService: EventoService = inject(EventoService);
  proveedorService: ProveedorServices = inject(ProveedorServices);
  route: ActivatedRoute = inject(ActivatedRoute);
  router: Router = inject(Router);
  private fb: FormBuilder = inject(FormBuilder);
  constructor(private cdr: ChangeDetectorRef) {
    this.crearForm = this.fb.group({
      Nombre: ['', Validators.required],
      Tipo: ['', Validators.required],
      FechaInicio: ['', Validators.required],
      FechaFin: ['', Validators.required],
      Aforo: ['', Validators.required],
      Descripcion: ['', Validators.required],
      Ubicacion: ['', Validators.required],
      Presupuesto: ['', Validators.required],
      aceptarTerminos: [false]
    });
  }
  ngOnInit(): void {
    const idProveedor = Number(this.route.snapshot.params['id']);
    console.log('🟩 ID de proveedor detectado:', idProveedor);
    if (!idProveedor) {
      alert('ID de proveedor inválido');
      return;
    }
    this.proveedorService.listarPorId(idProveedor).subscribe({
      next: (data) => {
        this.proveedor = data;
        console.log('Proveedor cargado:', this.proveedor);
      },
      error: (err) => {
        console.error('Error al obtener proveedor:', err);
        alert('No se pudo obtener el proveedor.');
      }
    });
  }
  registrarEvento(): void {
    console.log('🟦 [1] Iniciando registro de evento...');
    console.log('▶️ (ngSubmit) registrarEvento() llamado - estado form:', this.crearForm.status);
    if (this.crearForm.invalid) {
      console.warn('⚠️ [2] Formulario inválido:', this.crearForm.value);
      this.crearForm.markAllAsTouched();
      return;
    }

    if (!this.proveedor || !this.proveedor.id) {
      console.error('❌ [3] Proveedor no cargado o sin ID:', this.proveedor);
      alert('Proveedor no cargado. Intenta nuevamente.');
      return;
    }

    // Construcción del evento
    const nuevoEvento: Evento = {
      titulo: this.crearForm.value.Nombre,
      descripcion: this.crearForm.value.Descripcion,
      proveedor: { id: this.proveedor.id },
      tipoevento: { id: 1 },
      fechainicio: this.crearForm.value.FechaInicio,
      fechafin: this.crearForm.value.FechaFin,
      presupuesto: this.crearForm.value.Presupuesto,
      estado: 'Disponible',
      valoracion: 0,
      aforo: this.crearForm.value.Aforo,
      distrito: { id: 1 },
      direccion: this.crearForm.value.Ubicacion
    };

    console.log('🟩 [4] Objeto de evento listo para enviar:', nuevoEvento);

    // Envío del evento al backend
    this.eventoService.registrar(nuevoEvento).subscribe({
      next: (res: any) => {
        console.log('✅ [5] Respuesta del backend al registrar evento:', res);

        // registramos imagen si procede (igual que ya lo haces)
        if (res && res.id) {
          this.registrarImagenEvento(res.id);
        } else {
          // tu fallback con listar()
        }

        // Navegar al menú proveedor *solo después* del registro exitoso
        try {
          const idProveedorParaNavegar = this.proveedor?.id;
          if (idProveedorParaNavegar) {
            // log antes de navegar
            console.log('🔀 Navegando a menu-proveedor con id:', idProveedorParaNavegar);
            this.router.navigate(['/menu-proveedor', idProveedorParaNavegar]);
          } else {
            console.warn('No hay id de proveedor para navegar');
          }
        } catch (e) {
          console.error('Error al navegar:', e);
        }

        // limpieza y notificación
        alert('Evento registrado correctamente!');
        this.crearForm.reset();
        this.previewUrl = null;
        this.selectedFileBase64 = null;
      },
      error: (err) => {
        console.error('❌ [12] Error HTTP al registrar evento:', err);
        alert('Ocurrió un error al registrar el evento.');
      }
    });
  }
  registrarImagenEvento(idEvento: number): void {
    if (!this.selectedFileBase64) return;

    const imagenEvento: ImagenEvento = {
      imagen: this.selectedFileBase64,
      evento: { id: idEvento }
    };

    this.imagenEventoService.insert(imagenEvento).subscribe({
      next: () => console.log('Imagen asociada correctamente al evento'),
      error: (err) => console.error('Error al registrar la imagen:', err)
    });
  }
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        this.previewUrl = result;
        const base64SinPrefijo = result.split(',')[1];
        this.selectedFileBase64 = base64SinPrefijo;
      };
      reader.readAsDataURL(file);
    }
  }
  cerrarMenu(menu: Element, boton: Element) {
    menu.classList.remove('activo');
    menu.classList.add('saliendo');
    boton.classList.remove('activo');
    this.menuActivo = false;
  }

  toggleMenu() {
    if (this.animando) return;
    this.animando = true;
    const menu = document.querySelector('.menu-hamburguesa-text');
    const boton = document.querySelector('.menu-hamburguesa-boton');
    if (!menu || !boton) return;
    if (!this.menuActivo) {
      menu.classList.remove('saliendo');
      menu.classList.add('activo');
      boton.classList.add('activo');
      this.menuActivo = true;
    } else {
      menu.classList.remove('activo');
      menu.classList.add('saliendo');
      boton.classList.remove('activo');
      this.menuActivo = false;
    }
    setTimeout(() => (this.animando = false), 600);
  }
  toggleFiltrosAvanzados(){
    if (this.animando) return;
    this.animando = true;
    const overlay = document.querySelector('.overlay-buscar-avanzada');
    if (!overlay) return;
    const menuPerfil = document.querySelector('.encabezado-perfil-menu');
    if (this.menuPerfilActivo && menuPerfil) {
      this.cerrarMenuPerfil(menuPerfil);
    }
    const menuHamb = document.querySelector('.menu-hamburguesa-text');
    const botonHamb = document.querySelector('.menu-hamburguesa-boton');
    if (this.menuActivo && menuHamb && botonHamb) {
      this.cerrarMenu(menuHamb, botonHamb);
    }
    if (!this.mostrarFiltrosAvanzados) {
      overlay.classList.remove('saliendo');
      overlay.classList.add('activo');
      this.mostrarFiltrosAvanzados = true;
    } else {
      overlay.classList.remove('activo');
      overlay.classList.add('saliendo');
      this.mostrarFiltrosAvanzados = false;
    }
    setTimeout(() => (this.animando = false), 600);
  }

  abrirFiltros() {
    this.mostrarFiltrosAvanzados = true;
  }

  cerrarFiltros() {
    this.mostrarFiltrosAvanzados = false;
  }

  cerrarFiltrosAvanzados() {
    const overlay = document.querySelector('.overlay-buscar-avanzada');
    if (!overlay) return;
    overlay.classList.remove('activo');
    overlay.classList.add('saliendo');
    this.mostrarFiltrosAvanzados = false;
  }

  toggleMenuPerfil() {
    if (this.animando) return;
    this.animando = true;
    const menuPerfil = document.querySelector('.encabezado-perfil-menu');
    const overlay = document.querySelector('.overlay-buscar-avanzada');
    if (this.mostrarFiltrosAvanzados && overlay) {
      overlay.classList.remove('activo');
      overlay.classList.add('saliendo');
      this.mostrarFiltrosAvanzados = false;
    }
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

  cerrarMenuPerfil(menuPerfil: Element) {
    menuPerfil.classList.remove('activo');
    menuPerfil.classList.add('saliendo');
    this.menuPerfilActivo = false;
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

  @HostListener('document:click', ['$event'])
  onClickFuera(event: MouseEvent) {
    if (this.mostrarCerrarSesion) return;
    const menu = document.querySelector('.menu-hamburguesa-text');
    const boton = document.querySelector('.menu-hamburguesa-boton');
    const menuPerfil = document.querySelector('.encabezado-perfil-menu');
    const botonPerfil = document.querySelector('.encabezado-perfil-container');
    const target = event.target as HTMLElement;
    if (
      this.menuActivo && menu && boton && !menu.contains(target) && !boton.contains(target)) {
      this.cerrarMenu(menu, boton);
    }
    if (this.menuPerfilActivo && menuPerfil && botonPerfil && !menuPerfil.contains(target) && !botonPerfil.contains(target)) {
      this.cerrarMenuPerfil(menuPerfil);
    }
  }
  onDateSelected(event: { start: Date, end?: Date }) {
    console.log('Fecha seleccionada:', event.start, event.end);
    this.crearForm.patchValue({
      FechaInicio: event.start,
      FechaFin: event.end ?? event.start
    });
    this.crearForm.updateValueAndValidity();
    this.cdr.detectChanges();
  }
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }
  Desactivado(): boolean {
    console.log('🧠 Estado del formulario:', this.crearForm.status, this.crearForm.value);
    return this.crearForm.invalid;
  }
}
