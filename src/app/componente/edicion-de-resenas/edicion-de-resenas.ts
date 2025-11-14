import {ChangeDetectorRef, Component, HostListener, inject} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {NgOptimizedImage} from '@angular/common';

import { Location } from '@angular/common';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {Anfitrion} from '../../model/anfitrion';
import {Distrito} from '../../model/distrito';
import {Ciudad} from '../../model/ciudad';
import {TipoEvento} from '../../model/tipoEvento';
import {Evento} from '../../model/evento';
import {ImagenEvento} from '../../model/imagenEvento';
import {DistritoServices} from '../../services/distrito-services';
import {CiudadServices} from '../../services/ciudad-services';
import {TipoEventoServices} from '../../services/tipo-evento-services';
import {EventoService} from '../../services/evento-services';
import {AnfitrionServices} from '../../services/anfitrion-services';
import {ImagenEventoService} from '../../services/imagenEvento-services';
import {ResenaEvento} from '../../model/resenaEvento';
import {ResenaEventoServices} from '../../services/resena-evento-services';

@Component({
  selector: 'app-edicion-de-resenas',
  imports: [
    ReactiveFormsModule,
    NgOptimizedImage,
    RouterLink
  ],
  templateUrl: './edicion-de-resenas.html',
  styleUrl: './edicion-de-resenas.css',
})
export class EdicionDeResenas {
  anfitrion: Anfitrion;
  anfitrionNuevo: Anfitrion;
  id: number;
  distrito: Distrito[] = [];
  ciudad: Ciudad[] = [];
  tipoevento: TipoEvento[] = [];
  evento: Evento;
  imagenesEvento: ImagenEvento[] = [];
  distritoService: DistritoServices = inject(DistritoServices);
  ciudadService: CiudadServices = inject(CiudadServices);
  tipoEventoService: TipoEventoServices = inject(TipoEventoServices);
  eventoService: EventoService = inject(EventoService);
  anfitrionService: AnfitrionServices = inject(AnfitrionServices);
  router = inject(Router);
  imagenEventoService = inject(ImagenEventoService);
  buscarForm: FormGroup;
  buscarAvanzadaForm: FormGroup;
  resenaEvento: ResenaEvento;
  resenaEventoService: ResenaEventoServices = inject(ResenaEventoServices);
  mostrarFiltrosAvanzados = false;
  menuPerfilActivo = false;
  menuActivo = false;
  animando = false;
  mostrarCerrarSesion = false;
  resenaForm: FormGroup;
  currentRating = 0; // El rating actual guardado
  hoverRating = 0;   // El rating sobre el que pasa el mouse
  private fb: FormBuilder = inject(FormBuilder);
  private location = inject(Location); // Para el botón "volver"
  private route = inject(ActivatedRoute); // Para leer el ID de la URL

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
    const resenaId = this.route.snapshot.paramMap.get('id');
    console.log('ID de la reseña a editar:', resenaId);
    // Por ahora, usamos datos de ejemplo:
    this.resenaForm = this.fb.group({
      comentario: ['', Validators.required],
      rating: ['', Validators.required] // Ejemplo: 4 estrellas
    });
    // Carga el rating inicial del formulario
    this.currentRating = this.resenaForm.get('rating')?.value || 0;
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
    this.resenaEventoService.listarResenaEventoSegunEventoYAnfitrion(idAnfitrion, idEvento).subscribe({
      next: (resenas) => {
        if (resenas && resenas.length > 0) {
          this.resenaEvento = resenas[0];
          this.resenaForm.patchValue({
            comentario: this.resenaEvento.observacion,
            rating: this.resenaEvento.valoracion
          });
          this.currentRating = this.resenaEvento.valoracion;
          console.log('🔄 Modo edición de reseña:', this.resenaEvento);
        } else {
          console.log('🆕 Modo nueva reseña');
        }
      },
      error: (err) => console.error('Error al buscar reseña existente:', err)
    });
  }

  cargarAnfitrion(id: number): void {
    this.anfitrionService.listarPorId(id).subscribe({
      next: (data) => {
        this.anfitrion = data;
        this.anfitrion.foto = 'data:image/png;base64,' + this.anfitrion.foto;
        console.log('Anfitrión cargado:', this.anfitrion);
        this.anfitrionNuevo = {
          ...data,
          foto: data.foto?.split(',')[1] || data.foto
        };
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
  /*Seciont de edicon de reseñas*/

  seleccionarRating(rating: number) {
    this.currentRating = rating;
    this.resenaForm.get('rating')?.setValue(rating);
  }

  actualizarResena() {
    if (this.resenaForm.valid) {
      const formValue = this.resenaForm.value;

      const nuevaResena: ResenaEvento = {
        id: this.resenaEvento?.id,
        evento: this.evento,
        anfitrion: this.anfitrionNuevo,
        observacion: formValue.comentario,
        valoracion: formValue.rating
      };

      if (this.resenaEvento?.id) {
        console.log('🔄 Actualizando reseña existente...', nuevaResena);
        this.resenaEventoService.actualizar(nuevaResena).subscribe({
          next: (response) => {
            console.log('✅ Reseña actualizada correctamente', response);
            alert('Reseña actualizada correctamente');
            this.volverAtras();
          },
          error: (err) => {
            console.error('❌ Error al actualizar la reseña:', err);
            alert('Error al actualizar la reseña');
          }
        });
      } else {
        console.log('🆕 Registrando nueva reseña...', nuevaResena);
        this.resenaEventoService.registrar(nuevaResena).subscribe({
          next: (response) => {
            console.log('✅ Reseña registrada correctamente', response);
            alert('Reseña registrada correctamente');
            this.volverAtras();
          },
          error: (err) => {
            console.error('❌ Error al registrar la reseña:', err);
            alert('Error al registrar la reseña');
          }
        });
      }
    } else {
      console.warn('⚠️ Formulario inválido');
    }
  }
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
}
