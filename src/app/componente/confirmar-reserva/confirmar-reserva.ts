import {ChangeDetectorRef, Component, HostListener, inject} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {NgOptimizedImage, Location} from '@angular/common';
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
import {ContratoEvento} from '../../model/contratoEvento';
import {ContratoEventoServices} from '../../services/contrato-evento-services';

@Component({
  selector: 'app-confirmar-reserva',
  imports: [
    NgOptimizedImage,
    ReactiveFormsModule,
    RouterLink,
    ReactiveFormsModule, // Para el formulario de pago
    NgOptimizedImage     // Para ngSrc

  ],
  templateUrl: './confirmar-reserva.html',
  styleUrl: './confirmar-reserva.css',
})
export class ConfirmarReserva {
  contratoEvento: ContratoEvento;
  contratoEventoService: ContratoEventoServices = inject(ContratoEventoServices);
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
  route: ActivatedRoute = inject(ActivatedRoute);
  imagenEventoService = inject(ImagenEventoService);
  /*par el metodo de pago */
  metodoPagoSeleccionado: string = '';
  /**/
  private location = inject(Location);
  private router = inject(Router);
  mostrarRecibo = false;
  pagoForm: FormGroup;
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
    /* pagooos */
    this.pagoForm = this.fb.group({
      // El radio 'yapeplin' estará seleccionado por defecto, como en la imagen
      metodoPago: ['yapeplin', Validators.required]
    });
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

  volverAtras() {
    if (this.mostrarRecibo) {
      this.mostrarRecibo = false; // Vuelve del recibo a las opciones de pago
    } else {
      this.location.back(); // Vuelve de las opciones de pago a la página anterior
    }
  }

  procesarPago() {
    if (this.pagoForm.valid) {
      console.log('Procesando pago con:', this.pagoForm.value.metodoPago);
      // Simular pago exitoso y mostrar recibo
      this.mostrarRecibo = true;
      /*metodo para el metodod e pago*/
      const metodo = this.pagoForm.value.metodoPago;
      switch (metodo) {
        case 'yapeplin':
          this.metodoPagoSeleccionado = 'Yape o Plin';
          break;
        case 'tarjeta':
          this.metodoPagoSeleccionado = 'Tarjeta de crédito/débito';
          break;
        case 'transferencia':
          this.metodoPagoSeleccionado = 'Transferencia interbancaria';
          break;
        default:
          this.metodoPagoSeleccionado = 'Pago'; // Un valor por si acaso
      }
      const nuevoContrato: ContratoEvento = {
        anfitrion: this.anfitrionNuevo,
        evento: this.evento,
        fechacontrato: new Date(),
        fechafinalizacion: this.evento.fechafin,
        estado: 'En curso',
      };
      this.contratoEventoService.eventoContratado(nuevoContrato).subscribe({
        next: (respuesta) => {
          console.log('✅ ContratoEvento registrado correctamente:', respuesta);
          this.mostrarRecibo = true;
          this.pagoForm.reset({ metodoPago: 'yapeplin' });
          alert("Se realizó la operación con éxito.");
        },
        error: (error) => {
          console.error('❌ Error al registrar el contratoEvento:', error);
          alert('Ocurrió un error al procesar el pago. Intente nuevamente.');
        }
      });
    } else {
      console.log('Formulario de pago inválido');
    }
  }

  irAlInicio() {
    this.router.navigate(['/menu-anfitrion', this.anfitrion.id]);
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
