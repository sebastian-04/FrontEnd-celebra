import {ChangeDetectorRef, Component, HostListener, inject} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {NgOptimizedImage} from '@angular/common';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-historial-de-eventos',
  imports: [
    ReactiveFormsModule,
    NgOptimizedImage,
    RouterLink
  ],
  templateUrl: './historial-de-eventos.html',
  styleUrl: './historial-de-eventos.css',
})
export class HistorialDeEventos {
  buscarForm: FormGroup;
  buscarAvanzadaForm: FormGroup;
  mostrarFiltrosAvanzados = false;
  menuPerfilActivo = false;
  menuActivo = false;
  animando = false;
  mostrarCerrarSesion = false;
  private fb: FormBuilder = inject(FormBuilder);

  historialForm: FormGroup;
  eventos: any[] = [
    {
      // Debes tener estas imágenes en tu carpeta /assets
      imagen: '/assets/evento-boda-dia.png',
      titulo: 'Festival de música andina',
      rating: 4.7,
      reviews: 125,
      descripcion: 'Boda. Un día único y especial, lleno de amor, alegría y unión...',
      precio: 'S/.25000.00',
      personas: 250,
      fecha: '25/11/2025',
      link1: 'reseña no publicada aún',
      link2: 'Publicación de Reseñas'
    },
    {
      imagen: '/assets/evento-boda-noche.png',
      titulo: 'ExpoWedding',
      rating: 4.8,
      reviews: 327,
      descripcion: 'Boda. El evento combina momentos emotivos, como la ceremonia...',
      precio: 'S/.21000.00',
      personas: 200,
      fecha: '01/01/2026',
      link1: null, // Lo dejamos null para que no se muestre
      link2: 'Publicación de Reseñas'
    },
    {
      imagen: '/assets/evento-salon.png',
      titulo: 'Boda de Salón',
      rating: 4.5,
      reviews: 205,
      descripcion: 'Boda. Cada detalle, desde la decoración hasta la música...',
      precio: 'S/.22000.00',
      personas: 150,
      fecha: '09/03/2026',
      link1: null,
      link2: 'Publicación de Reseñas'
    },
    // Duplico los datos para llenar la grilla
    {
      imagen: '/assets/evento-boda-dia.png',
      titulo: 'Festival de música andina 2',
      rating: 4.7,
      reviews: 125,
      descripcion: 'Boda. Un día único y especial, lleno de amor, alegría y unión...',
      precio: 'S/.25000.00',
      personas: 250,
      fecha: '25/11/2025',
      link1: 'reseña no publicada aún',
      link2: 'Publicación de Reseñas'
    },
    {
      imagen: '/assets/evento-boda-noche.png',
      titulo: 'ExpoWedding 2',
      rating: 4.8,
      reviews: 327,
      descripcion: 'Boda. El evento combina momentos emotivos, como la ceremonia...',
      precio: 'S/.21000.00',
      personas: 200,
      fecha: '01/01/2026',
      link1: null,
      link2: 'Publicación de Reseñas'
    },
    {
      imagen: '/assets/evento-salon.png',
      titulo: 'Boda de Salón 2',
      rating: 4.5,
      reviews: 205,
      descripcion: 'Boda. Cada detalle, desde la decoración hasta la música...',
      precio: 'S/.22000.00',
      personas: 150,
      fecha: '09/03/2026',
      link1: null,
      link2: 'Publicación de Reseñas'
    }
  ];
  // --- FIN DE PROPIEDADES AÑADIDAS ---


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


    /* HISTORIAL DE EVENTOS*/
    this.historialForm = this.fb.group({
      filtro: ['recientes', Validators.required]
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




}
