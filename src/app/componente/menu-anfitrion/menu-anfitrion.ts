import {ChangeDetectorRef, Component, ElementRef, HostListener, inject, OnInit, ViewChild} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {debounceTime, fromEvent} from 'rxjs';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {Evento} from '../../model/evento';
import {EventoService} from '../../services/evento-services';
import {ImagenEventoService} from '../../services/imagenEvento-services';
import {ImagenEvento} from '../../model/imagenEvento';
import {Anfitrion} from '../../model/anfitrion';
import {AnfitrionServices} from '../../services/anfitrion-services';
import {TipoEvento} from '../../model/tipoEvento';

@Component({
  selector: 'app-menu-anfitrion',
  standalone: true,
  imports: [
    NgOptimizedImage,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './menu-anfitrion.html',
  styleUrl: './menu-anfitrion.css',
})
export class MenuAnfitrion implements OnInit {
  anfitrion: Anfitrion;
  id: number;
  menuActivo = false;
  animando = false;
  buscarForm: FormGroup;
  buscarAvanzadaForm: FormGroup;
  mostrarCerrarSesion = false;
  scrollPosition = 0;
  barraHeight = 64;
  alturaTotalContenido = 0;
  opacidadSuperior = 0;
  opacidadInferior = 0;
  corazonActivo = false;
  mostrarFiltrosAvanzados = false;
  menuPerfilActivo = false;
  eventos: Evento[] = [];
  imagenesEvento: ImagenEvento[] = [];
  tipoEventos: TipoEvento[] = [];
  eventoService: EventoService = inject(EventoService);
  anfitrionService: AnfitrionServices = inject(AnfitrionServices);
  route: ActivatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private imagenEventoService = inject(ImagenEventoService);
  private fb: FormBuilder = inject(FormBuilder);
  constructor(private cdr: ChangeDetectorRef) {
    this.buscarForm = this.fb.group({
      Donde: ['', Validators.required],
      Aforo: ['', Validators.required],
      Fecha: ['', Validators.required],
    })
    this.buscarAvanzadaForm = this.fb.group({
      UbicacionAvanzada: ['', Validators.required],
      TipoEventoAvanzada: ['', Validators.required],
      FechaInicioAvanzada: ['', Validators.required],
      FechaFinAvanzada: ['', Validators.required],
      AforoAvanzada: ['', Validators.required],
      PresupuestoAvanzada: ['', Validators.required],
    })
  }
  ngOnInit(): void {
    const idParam = this.route.snapshot.params['id'];
    const id = Number(idParam);
    this.cargarAnfitrion(id);
    this.cargarEventosAleatorios();
  }
  cargarEventosAleatorios(): void {
    this.eventoService.listar().subscribe({
      next: (data) => {
        this.eventos = data;
        console.log('Eventos cargados:', this.eventos);
        this.eventos.forEach(evento => {
          if (evento.id != null) {
            this.cargarImagenesPorEvento(evento.id);
          }
        });
      },
      error: (err) => {
        console.error('Error al cargar los eventos', err);
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
  cargarImagenesPorEvento(idEvento: number) {
    this.imagenEventoService.listarPorIdEvento(idEvento).subscribe({
      next: (imagenes: ImagenEvento[]) => {
        if (imagenes && imagenes.length > 0) {
          // Agregar todas las imágenes al arreglo
          this.imagenesEvento = this.imagenesEvento.concat(imagenes);
          console.log('Imágenes cargadas:', this.imagenesEvento);
        }
      },
      error: (err) => console.error(`Error al cargar imágenes del evento ${idEvento}:`, err)
    });
  }
  obtenerImagenPorEvento(idEvento: number): string {
    const imagenEncontrada = this.imagenesEvento.find(img => img.evento.id === idEvento);
    if (imagenEncontrada && imagenEncontrada.imagen) {
      return 'data:image/png;base64,' + imagenEncontrada.imagen;
    } else {
      return '/assets/placeholder.png';
    }
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
  cerrarMenu(menu: Element, boton: Element) {
    menu.classList.remove('activo');
    menu.classList.add('saliendo');
    boton.classList.remove('activo');
    this.menuActivo = false;
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
  @ViewChild('listaEventos') listaEventos!: ElementRef;
  ngAfterViewInit() {
    this.calcularAlturaTotal();
    const lista = this.listaEventos.nativeElement;
    fromEvent(lista, 'scroll')
      .pipe(debounceTime(5))
      .subscribe(() => this.actualizarPosicionBarra());
  }
  calcularAlturaTotal() {
    if (this.listaEventos?.nativeElement) {
      const eventosElements = this.listaEventos.nativeElement.querySelectorAll('.eventos-container-item');
      let alturaAcumulada = 0;
      eventosElements.forEach((elemento: HTMLElement) => {
        alturaAcumulada += elemento.offsetHeight + 20;
      });
      this.alturaTotalContenido = alturaAcumulada;
      console.log('📏 Altura total del contenido:', this.alturaTotalContenido, 'px');
    }
  }
  actualizarPosicionBarra() {
    if (!this.listaEventos?.nativeElement) return;
    const lista = this.listaEventos.nativeElement;
    const scrollTop = lista.scrollTop;
    const totalScrollable = lista.scrollHeight - lista.clientHeight;
    const barra1 = document.querySelector('.barra-1') as HTMLElement;
    if (!barra1) return;
    const alturaBarra1 = barra1.clientHeight;
    const espacioBarra = Math.max(0, alturaBarra1 - this.barraHeight);
    if (totalScrollable > 0) {
      const scrollPercent = scrollTop / totalScrollable;
      const targetPos = scrollPercent * espacioBarra;
      this.scrollPosition = Math.min(espacioBarra, Math.max(0, targetPos));
    } else {
      this.scrollPosition = 0;
    }
    const zonaDifuminada = 80;
    const distanciaDesdeTop = scrollTop;
    const distanciaDesdeBottom = totalScrollable - scrollTop;
    this.opacidadSuperior = Math.min(1, distanciaDesdeTop / zonaDifuminada);
    this.opacidadInferior = Math.min(1, distanciaDesdeBottom / zonaDifuminada);
  }
  onBarraMouseDown(event: MouseEvent) {
    event.preventDefault();
    const wrapper = (event.currentTarget as HTMLElement).closest('.eventos-navegacion') as HTMLElement;
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const espacioBarra = Math.max(0, rect.height - this.barraHeight);
    const startY = event.clientY;
    const startScrollPos = this.scrollPosition;
    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      let nuevaPosicion = startScrollPos + deltaY;
      nuevaPosicion = Math.min(espacioBarra, Math.max(0, nuevaPosicion));
      this.scrollPosition = nuevaPosicion;
      if (this.listaEventos?.nativeElement) {
        const lista = this.listaEventos.nativeElement;
        const totalScrollable = lista.scrollHeight - lista.clientHeight;
        if (totalScrollable > 0) {
          const newScrollTop = (nuevaPosicion / espacioBarra) * totalScrollable;
          lista.scrollTop = newScrollTop;
        }
      }
    };
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }
  getOpacityFor(index: number): number {
    if (!this.listaEventos) return 1;
    const lista = this.listaEventos.nativeElement;
    const item = lista.children[index] as HTMLElement;
    if (!item) return 1;
    const rect = item.getBoundingClientRect();
    const containerRect = lista.getBoundingClientRect();
    const visibleHeight = Math.min(rect.bottom, containerRect.bottom) - Math.max(rect.top, containerRect.top);
    const ratio = Math.max(0, Math.min(1, visibleHeight / rect.height));
    return 0.3 + 0.7 * ratio;
  }
  onScroll() {
    this.cdr.detectChanges();
  }
  onCorazonClick(event: MouseEvent) {
    const img = event.target as HTMLImageElement;
    if (!img) return;
    img.classList.toggle('activo');
    if (img.classList.contains('activo')) {
      img.src = '/assets/HeartPintado.png';
    } else {
      img.src = '/assets/Heart.png';
    }
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
  buscar() {
    if (this.buscarForm.valid && this.anfitrion?.id) {
      const filtro = this.buscarForm.value;

      this.router.navigate(
        ['/buscar-eventos', this.anfitrion.id],
        {
          queryParams: {
            idDistrito: filtro.Donde,
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
          ubicacion: filtro.UbicacionAvanzada,
          tipoEvento: filtro.TipoEventoAvanzada,
          fechaInicio: filtro.FechaInicioAvanzada,
          fechaFin: filtro.FechaFinAvanzada,
          aforo: filtro.AforoAvanzada,
          presupuesto: filtro.PresupuestoAvanzada,
        },
      });
    }
  }
}
