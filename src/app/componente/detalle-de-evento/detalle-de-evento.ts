import {ChangeDetectorRef, Component, HostListener, inject} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {NgOptimizedImage, NgStyle, Location} from '@angular/common';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {Anfitrion} from '../../model/anfitrion';
import {DistritoServices} from '../../services/distrito-services';
import {CiudadServices} from '../../services/ciudad-services';
import {TipoEventoServices} from '../../services/tipo-evento-services';
import {EventoService} from '../../services/evento-services';
import {AnfitrionServices} from '../../services/anfitrion-services';
import {ImagenEventoService} from '../../services/imagenEvento-services';
import {Distrito} from '../../model/distrito';
import {Ciudad} from '../../model/ciudad';
import {TipoEvento} from '../../model/tipoEvento';
import {Evento} from '../../model/evento';
import {ImagenEvento} from '../../model/imagenEvento';
import {ResenaEvento} from '../../model/resenaEvento';
import {ResenaEventoServices} from '../../services/resena-evento-services';
import {ContratoEvento} from '../../model/contratoEvento';
import {ContratoEventoServices} from '../../services/contrato-evento-services';

@Component({
  selector: 'app-detalle-de-evento',
  imports: [
    NgOptimizedImage,
    RouterLink,
    ReactiveFormsModule,
    NgOptimizedImage// Necesario para el [style.transform]
  ],

  templateUrl: './detalle-de-evento.html',
  styleUrl: './detalle-de-evento.css',
})
export class DetalleDeEvento {
  anfitrion: Anfitrion;
  id: number;
  distrito: Distrito[] = [];
  ciudad: Ciudad[] = [];
  tipoevento: TipoEvento[] = [];
  resenaEvento: ResenaEvento[] = [];
  evento: Evento;
  imagenesEvento: ImagenEvento[] = [];
  contratoEvento: ContratoEvento[] = [];
  contratoEventoService: ContratoEventoServices = inject(ContratoEventoServices);
  resenEventoService: ResenaEventoServices = inject(ResenaEventoServices);
  distritoService: DistritoServices = inject(DistritoServices);
  ciudadService: CiudadServices = inject(CiudadServices);
  tipoEventoService: TipoEventoServices = inject(TipoEventoServices);
  eventoService: EventoService = inject(EventoService);
  anfitrionService: AnfitrionServices = inject(AnfitrionServices);
  route: ActivatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  imagenEventoService = inject(ImagenEventoService);
  /* para el fokin  carrusel */
  private location = inject(Location);

  // --- Lógica del Carrusel (NUEVA) ---

  // 1. Define cuántos items mostrar
  itemsPorVista = 3;

  // 2. Calcula el ancho de cada "slide"
  // (100% / 3 = 33.333%)
  slideWidthPercentage = 100 / this.itemsPorVista;

  // 3. El índice de la primera imagen visible
  currentSlideIndex = 0;

  /*fin*/
  buscarForm: FormGroup;
  buscarAvanzadaForm: FormGroup;
  mostrarFiltrosAvanzados = false;
  menuPerfilActivo = false;
  menuActivo = false;
  animando = false;
  mostrarCerrarSesion = false;
  private fb: FormBuilder = inject(FormBuilder);

  constructor(private cdr: ChangeDetectorRef) {
    this.buscarForm = this.fb.group({
      Distrito: ['', Validators.required],
      Aforo: ['', Validators.required],
      Fecha: ['', Validators.required],
    })
    this.buscarAvanzadaForm = this.fb.group({
      UbicacionAvanzada: ['', Validators.required],
      TipoEventoAvanzada: ['', Validators.required],
      FechaInicioAvanzada: ['', Validators.required],
      FechaFinAvanzada: ['', Validators.required],
      AforoAvanzadaMin: ['', Validators.required],
      AforoAvanzadaMax: ['', Validators.required],
      PresupuestoAvanzadaMin: ['', Validators.required],
      PresupuestoAvanzadaMax: ['', Validators.required],
    })
  }

  ngOnInit(): void {
    const idAnfitrion = Number(this.route.snapshot.params['idAnfitrion']);
    const idEvento = Number(this.route.snapshot.params['idEvento']);
    this.cargarAnfitrion(idAnfitrion);
    this.distritoService.listar().subscribe({
      next: (data) => this.distrito = data,
      error: (err) => console.error('Error al cargar los distritos', err)
    })
    this.ciudadService.listar().subscribe({
      next: (data) => this.ciudad = data,
    })
    this.tipoEventoService.listar().subscribe({
      next: (data) => this.tipoevento = data,
    })
    this.cargarEventos(idEvento);
    this.resenEventoService.listarResenaEventoSegunEvento(idEvento).subscribe({
      next: (data) => this.resenaEvento = data,
    })
    this.contratoEventoService.verEventosContratadosPorIdAnfitrion(idAnfitrion).subscribe({
        next: (data) => {
          this.contratoEvento = data.filter(c => c.evento.id === idEvento);
        }
      });
  }

  cargarAnfitrion(id: number): void {
    this.anfitrionService.listarPorId(id).subscribe({
      next: (data) => {
        this.anfitrion = data;
        this.anfitrion.foto = 'data:image/png;base64,' + this.anfitrion.foto;
        console.log('Anfitrión cargado:', this.anfitrion);
      },
      error: (err) => {
        console.error('Error al cargar el anfitrión', err);
      }
    });
  }

  cargarEventos(id: number): void {
    this.eventoService.listarPorId(id).subscribe({
      next: (data) => {
        this.evento = data;
        console.log('Eventos cargados:', this.evento);
        this.cargarImagenesPorEvento(data.id!);
      },
      error: (err) => {
        console.error('Error al cargar los eventos', err);
      }
    });
  }

  cargarImagenesPorEvento(idEvento: number) {
    this.imagenEventoService.listarPorIdEvento(idEvento).subscribe({
      next: (imagenes: ImagenEvento[]) => {
        if (imagenes && imagenes.length > 0) {
          this.imagenesEvento = imagenes.map(img => ({
            ...img,
            imagen: 'data:image/jpeg;base64,' + img.imagen
          }));
          console.log('🖼️ Imágenes del evento cargadas:', this.imagenesEvento);
        } else {
          console.warn('⚠️ No se encontraron imágenes para el evento', idEvento);
        }
      },
      error: (err) => console.error(`Error al cargar imágenes del evento ${idEvento}:`, err)
    });
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

  toggleFiltrosAvanzados() {
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

  /* detalle de evento*/
  siguienteSlide() {
    // El límite es el número total de imágenes MENOS los items que ya se ven
    const maxIndex = this.imagenesEvento.length - this.itemsPorVista;
    if (this.currentSlideIndex < maxIndex) {
      this.currentSlideIndex++;
    }
  }

  anteriorSlide() {
    if (this.currentSlideIndex > 0) {
      this.currentSlideIndex--;
    }
  }

  // --- Fin Lógica Carrusel ---

  /**
   * Navega a la página anterior
   */
  volverAtras() {
    this.location.back();
  }

  buscar() {
    if (this.buscarForm.valid && this.anfitrion.id) {
      const filtro = this.buscarForm.value;
      this.router.navigate(
        ['/buscar-eventos', this.anfitrion.id],
        {
          queryParams: {
            distrito: Number(filtro.Distrito),
            aforo: filtro.Aforo,
            fechaInicio: filtro.Fecha
          }
        }
      );
    }
  }

  buscarAvanzada(): void {
    if (this.buscarAvanzadaForm.valid && this.anfitrion?.id) {
      const filtro = this.buscarAvanzadaForm.value;
      this.router.navigate(['/buscar-eventos', this.anfitrion.id], {
        queryParams: {
          ubicacion: Number(filtro.UbicacionAvanzada),
          tipoEvento: Number(filtro.TipoEventoAvanzada),
          fechaInicio: filtro.FechaInicioAvanzada,
          fechaFin: filtro.FechaFinAvanzada,
          aforoMin: filtro.AforoAvanzadaMin,
          aforoMax: filtro.AforoAvanzadaMax,
          presupuestoMin: filtro.PresupuestoAvanzadaMin,
          presupuestoMax: filtro.PresupuestoAvanzadaMax,
        },
      });
    }
  }

  getStars(rating: number): any[] {
    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars;

    // Devuelve [true, true, true, false, false] para un rating de 3
    return new Array(fullStars).fill(true).concat(new Array(emptyStars).fill(false));
  }

  eliminarResena(id: number) {
    this.resenEventoService.eliminar(id).subscribe({
      next: () => {
        console.log(`✅ Reseña con ID ${id} eliminada correctamente`);
        this.resenaEvento = this.resenaEvento.filter(r => r.id !== id);
        alert('Reseña eliminada correctamente');
        this.ngOnInit();
      },
      error: (err) => {
        console.error('❌ Error al eliminar la reseña:', err);
        alert('Error al eliminar la reseña');
      }
    });
  }

  finalizarContrato(id: number, anfitrion: Anfitrion, evento: Evento, fechacontrato: Date) {
    const nuevoContrato: ContratoEvento = {
      id: id,
      anfitrion: anfitrion,
      evento: evento,
      fechacontrato: fechacontrato,
      fechafinalizacion: new Date(),
      estado: 'Finalizado',
    };
    this.contratoEventoService.eventoFinalizado(nuevoContrato).subscribe({
      next: (respuesta) => {
        console.log('✅ ContratoEvento finalizado correctamente:', respuesta);
        alert("El contrato fue finalizado con éxito");
      },
      error: (error) => {
        console.error('❌ Error al finalizar el contratoEvento:', error);
        alert("El contrato no se pudo finalizar");
      }
    });
  }
}
