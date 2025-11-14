import { ChangeDetectorRef, Component, HostListener, inject, OnInit, OnDestroy } from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { startWith } from 'rxjs/operators';

// Services & Models
import { DistritoServices } from '../../services/distrito-services';
import { AnfitrionServices } from '../../services/anfitrion-services';
import { CiudadServices } from '../../services/ciudad-services';
import { TipoEventoServices } from '../../services/tipo-evento-services';
import { EventoService } from '../../services/evento-services';
import { ImagenEventoService } from '../../services/imagenEvento-services';
import { ContratoEventoServices } from '../../services/contrato-evento-services';
import { ResenaEventoServices } from '../../services/resena-evento-services';

import { Distrito } from '../../model/distrito';
import { Anfitrion } from '../../model/anfitrion';
import { ImagenEvento } from '../../model/imagenEvento';
import { TipoEvento } from '../../model/tipoEvento';
import { Ciudad } from '../../model/ciudad';
import { ContratoEvento } from '../../model/contratoEvento';
import { ResenaEvento } from '../../model/resenaEvento';
import {Proveedor} from '../../model/proveedor';
import {ProveedorServices} from '../../services/proveedor-services';

@Component({
  selector: 'app-historial-de-contratos',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './historial-de-contratos.html',
  styleUrl: './historial-de-contratos.css',
})
export class HistorialDeContratos {
  // Inyecciones
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);
  private route = inject(Router);
  private router = inject(ActivatedRoute);

  proveedorService: ProveedorServices = inject(ProveedorServices);
  distritoService = inject(DistritoServices);
  ciudadService = inject(CiudadServices);
  tipoEventoService = inject(TipoEventoServices);
  eventoService = inject(EventoService);
  imagenEventoService = inject(ImagenEventoService);
  contratoEventoService = inject(ContratoEventoServices);
  anfitrionService = inject(AnfitrionServices);
  resenaEventoServices = inject(ResenaEventoServices);

  // Datos
  id: number = 0;
  anfitrion!: Anfitrion;
  distrito: Distrito[] = [];
  ciudad: Ciudad[] = [];
  tipoEvento: TipoEvento[] = [];
  contratoEvento: ContratoEvento[] = [];
  resenaEvento: ResenaEvento[] = [];
  proveedor: Proveedor;
  // Mapa de Imágenes y control de estado
  imagenesEvento: { [idEvento: number]: ImagenEvento[] } = {};
  indices: { [key: number]: number } = {};
  indicePrevio: { [key: number]: number } = {};
  intervalos: { [key: number]: any } = {};

  // Formularios y UI
  buscarForm: FormGroup;
  buscarAvanzadaForm: FormGroup;
  historialForm!: FormGroup;

  mostrarFiltrosAvanzados = false;
  menuPerfilActivo = false;
  menuActivo = false;
  animando = false;
  mostrarCerrarSesion = false;

  constructor() {}

  ngOnInit(): void {
    const idParam = this.router.snapshot.params['id'];
    this.id = Number(idParam);

    // Cargar datos auxiliares
    this.cargarProveedor(this.id);
    this.cargarListasAuxiliares();

    // Configurar formulario
    this.historialForm = this.fb.group({
      filtro: ['recientes']
    });

    // SOLUCIÓN MAESTRA: Usamos 'startWith' para disparar la carga inicial
    // como si fuera un filtro automático. Esto unifica la lógica.
    this.historialForm.get('filtro')?.valueChanges
      .pipe(
        startWith('recientes') // <--- Esto fuerza la ejecución inmediata al cargar la página
      )
      .subscribe(() => {
        this.cargarContratos(this.id);
      });

    setTimeout(() => {
      this.cargarContratos(this.id);
    });
  }

  cargarListasAuxiliares() {
    this.distritoService.listar().subscribe(data => this.distrito = data);
    this.ciudadService.listar().subscribe(data => this.ciudad = data);
    this.tipoEventoService.listar().subscribe(data => this.tipoEvento = data);
    this.resenaEventoServices.listarResenaEventos().subscribe(data => this.resenaEvento = data);
  }

  cargarContratos(id: number): void {
    const filtro = this.historialForm.get('filtro')?.value;

    this.limpiarIntervalos();
    this.imagenesEvento = {};
    this.indices = {};
    this.indicePrevio = {};

    this.obtenerContratosSegunFiltro(id, filtro).subscribe({
      next: (data) => {
        this.contratoEvento = data;
        console.log(`Contratos cargados (${filtro}):`, this.contratoEvento.length);

        this.contratoEvento.forEach(contrato => {
          if (contrato.evento && contrato.evento.id) {
            this.cargarImagenesPorEvento(contrato.evento.id);
          }
        });
      },
      error: (err) => console.error('Error al cargar contratos', err)
    });
  }

  cargarImagenesPorEvento(idEvento: number) {
    this.imagenEventoService.listarPorIdEvento(idEvento).subscribe({
      next: (imagenes: ImagenEvento[]) => {
        if (!imagenes || imagenes.length === 0) {
          // Asignamos array vacío para que el HTML sepa que ya cargó
          this.imagenesEvento = { ...this.imagenesEvento, [idEvento]: [] };
          this.cdr.detectChanges();
          return;
        }

        // Normalización de Base64
        const normalizadas = imagenes.map(img => {
          const raw = (img as any).imagenEvento || img.imagen || '';
          let imagenFinal = '';
          if (raw && typeof raw === 'string') {
            imagenFinal = raw.startsWith('data:image') ? raw : 'data:image/png;base64,' + raw;
          }
          return { ...img, imagen: imagenFinal };
        });

        // Actualizamos el mapa de imágenes
        // Usamos el spread (...) para forzar a Angular a detectar el cambio en el objeto
        this.imagenesEvento = {
          ...this.imagenesEvento,
          [idEvento]: normalizadas
        };

        // Configuramos el índice inicial (Visible inmediatamente)
        if (this.indices[idEvento] === undefined) {
          this.indices[idEvento] = 0;
          this.indicePrevio[idEvento] = -1;
        }

        // Forzamos la detección de cambios para pintar la primera imagen YA
        this.cdr.detectChanges();

        // Arrancamos el carrusel
        this.iniciarCarrusel(idEvento);
      },
      error: (err) => console.error(`Error imágenes evento ${idEvento}:`, err),
    });
  }

  iniciarCarrusel(idEvento: number) {
    if (this.intervalos[idEvento]) {
      clearInterval(this.intervalos[idEvento]);
    }

    this.intervalos[idEvento] = window.setInterval(() => {
      const imgs = this.imagenesEvento[idEvento];
      if (!imgs || imgs.length <= 1) return;

      const total = imgs.length;
      const indiceActual = this.indices[idEvento];
      const indiceSiguiente = (indiceActual + 1) % total;

      // Evitar animación doble en el salto del último al primero
      this.indicePrevio[idEvento] = indiceActual;
      this.indices[idEvento] = indiceSiguiente;

      // Forzar Angular a pintar cambios
      this.cdr.detectChanges();
    }, 3000);
  }

  limpiarIntervalos() {
    for (const key in this.intervalos) {
      if (this.intervalos.hasOwnProperty(key)) {
        clearInterval(this.intervalos[key]);
      }
    }
    this.intervalos = {};
  }

  obtenerContratosSegunFiltro(id: number, filtro: string) {
    switch (filtro) {
      case 'antiguos': return this.contratoEventoService.historialContratosSegunProveedorPorFechaMasAntigua(id);
      case 'mayor-presupuesto': return this.contratoEventoService.historialContratosSegunProveedorPorMayorPresupuesto(id);
      case 'menor-presupuesto': return this.contratoEventoService.historialContratosSegunProveedorPorMenorPresupuesto(id);
      case 'mejor-valorados': return this.contratoEventoService.historialContratosSegunProveedorPorMejorValoracion(id);
      case 'peor-valorados': return this.contratoEventoService.historialContratosSegunProveedorPorPeorValoracion(id);
      case 'recientes': return this.contratoEventoService.historialContratosSegunProveedorPorFechaMasReciente(id);
      default: return this.contratoEventoService.historialContratosSegunProveedorPorFechaMasReciente(id);
    }
  }

  cargarProveedor(id: number): void {
    this.proveedorService.listarPorId(id).subscribe({
      next: (data) => {
        this.proveedor = data;
        if (this.proveedor.foto && !this.proveedor.foto.startsWith('data:')) {
          this.proveedor.foto = 'data:image/png;base64,' + this.proveedor.foto;
        }
      },
      error: (err) => console.error('Error al cargar proveedor', err)
    });
  }

  // Helper para HTML
  obtenerImagenesPorEvento(idEvento: number): ImagenEvento[] {
    return this.imagenesEvento[idEvento] || [];
  }

  // --- UI & MENU LOGIC ---

  toggleMenu() {
    if (this.animando) return;
    this.animando = true;
    this.menuActivo = !this.menuActivo;
    const menu = document.querySelector('.menu-hamburguesa-text');
    const boton = document.querySelector('.menu-hamburguesa-boton');

    if (this.menuActivo) {
      menu?.classList.remove('saliendo'); menu?.classList.add('activo');
      boton?.classList.add('activo');
    } else {
      menu?.classList.remove('activo'); menu?.classList.add('saliendo');
      boton?.classList.remove('activo');
    }
    setTimeout(() => (this.animando = false), 600);
  }

  toggleFiltrosAvanzados() {
    if (this.animando) return;
    this.animando = true;
    this.mostrarFiltrosAvanzados = !this.mostrarFiltrosAvanzados;
    const overlay = document.querySelector('.overlay-buscar-avanzada');
    if (this.mostrarFiltrosAvanzados) {
      overlay?.classList.remove('saliendo'); overlay?.classList.add('activo');
    } else {
      overlay?.classList.remove('activo'); overlay?.classList.add('saliendo');
    }
    setTimeout(() => (this.animando = false), 600);
  }

  cerrarFiltrosAvanzados() {
    this.mostrarFiltrosAvanzados = false;
    const overlay = document.querySelector('.overlay-buscar-avanzada');
    overlay?.classList.remove('activo'); overlay?.classList.add('saliendo');
  }

  toggleMenuPerfil() {
    if (this.animando) return;
    this.animando = true;
    this.menuPerfilActivo = !this.menuPerfilActivo;
    const menuPerfil = document.querySelector('.encabezado-perfil-menu');
    if (this.menuPerfilActivo) {
      menuPerfil?.classList.remove('saliendo'); menuPerfil?.classList.add('activo');
    } else {
      menuPerfil?.classList.remove('activo'); menuPerfil?.classList.add('saliendo');
    }
    setTimeout(() => (this.animando = false), 600);
  }

  abrirModalCerrarSesion() {
    this.mostrarCerrarSesion = true;
    document.body.classList.add('modal-abierto');
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

  cerrarSesion() {
    this.mostrarCerrarSesion = false;
  }

  @HostListener('document:click', ['$event'])
  onClickFuera(event: MouseEvent) {
    if (this.mostrarCerrarSesion) return;
    const target = event.target as HTMLElement;
    const esMenuHamb = target.closest('.menu-hamburguesa-text') || target.closest('.menu-hamburguesa-boton');
    const esPerfil = target.closest('.encabezado-perfil-menu') || target.closest('.encabezado-perfil-container');

    if (this.menuActivo && !esMenuHamb) this.toggleMenu();
    if (this.menuPerfilActivo && !esPerfil) this.toggleMenuPerfil();
  }

  ngOnDestroy() {
    this.limpiarIntervalos();
  }
}
