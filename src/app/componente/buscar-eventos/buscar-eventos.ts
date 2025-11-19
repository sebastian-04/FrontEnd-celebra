import {ChangeDetectorRef, Component, ElementRef, HostListener, inject, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {Anfitrion} from '../../model/anfitrion';
import {AnfitrionServices} from '../../services/anfitrion-services';
import {Evento} from '../../model/evento';
import {EventoService} from '../../services/evento-services';
import {ImagenEvento} from '../../model/imagenEvento';
import {debounceTime, fromEvent} from 'rxjs';
import {ImagenEventoService} from '../../services/imagenEvento-services';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {Distrito} from '../../model/distrito';
import {DistritoServices} from '../../services/distrito-services';
import {Ciudad} from '../../model/ciudad';
import {TipoEvento} from '../../model/tipoEvento';
import {CiudadServices} from '../../services/ciudad-services';
import {TipoEventoServices} from '../../services/tipo-evento-services';
import {Mensaje} from '../../model/mensaje';
import {MensajeServices} from '../../services/mensaje-services';
import {Chat} from '../../model/chat';
import {ChatServices} from '../../services/chat-services';

@Component({
  selector: 'app-buscar-eventos',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    CommonModule,
    NgOptimizedImage,
    FormsModule
  ],
  templateUrl: './buscar-eventos.html',
  styleUrl: './buscar-eventos.css',
})
export class BuscarEventos {
  private pollingInterval: any;
  private chatListPollingInterval: any;
  mensajes: Mensaje[] = [];
  mensajeService: MensajeServices = inject(MensajeServices);
  chats: Chat[] = [];
  chatService: ChatServices = inject(ChatServices);
  chatVisible: boolean = false;
  activeChatId: number | null = null;
  activeChatName: string | null = null;
  activeChatAvatar: string | null = null;
  mensajeTexto: string = '';
  idAnfitrion!: number;
  anfitrion: Anfitrion;
  eventosFiltrados: Evento[] = [];
  eventosFiltradosAvanzados: Evento[] = [];
  ciudad: Ciudad[] = [];
  tipoEvento: TipoEvento[] = [];
  ciudadService: CiudadServices = inject(CiudadServices);
  tipoEventoService: TipoEventoServices = inject(TipoEventoServices);
  filtros: any = {};
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
  mostrarFiltrosAvanzados = false;
  menuPerfilActivo = false;
  anfitrionService: AnfitrionServices = inject(AnfitrionServices);
  distritoService: DistritoServices = inject(DistritoServices);
  router: Router = inject(Router);
  distrito: Distrito[] = [];
  eventos: Evento[] = [];
  eventoService: EventoService = inject(EventoService);
  imagenEventoService: ImagenEventoService = inject(ImagenEventoService);
  imagenesEvento: ImagenEvento[] = [];
  private route = inject(ActivatedRoute);
  private fb: FormBuilder = inject(FormBuilder);
  constructor(private cdr: ChangeDetectorRef) {}
  ngOnInit(): void {
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
    this.distritoService.listar().subscribe({
      next: (data) => this.distrito = data,
      error: (err) => console.error('Error al cargar los distritos', err)
    })
    this.ciudadService.listar().subscribe({
      next: (data) => this.ciudad = data,
    })
    this.tipoEventoService.listar().subscribe({
      next: (data) => this.tipoEvento = data,
    })
    this.idAnfitrion = Number(this.route.snapshot.params['id']);
    this.anfitrionService.listarPorId(this.idAnfitrion).subscribe({
      next: (data: Anfitrion) => {
        this.anfitrion = data;
        this.anfitrion.foto = 'data:image/png;base64,' + this.anfitrion.foto;
        console.log('Anfitrión cargado:', this.anfitrion);
      },
      error: (err) => console.error('Error al cargar anfitrión:', err)
    });
    this.route.queryParams.subscribe(params => {
      this.filtros = params;
      console.log('Filtros recibidos:', this.filtros);

      if (params['distrito'] && params['aforo'] && params['fechaInicio']) {
        this.buscarEventosBasico(
          params['distrito'],
          Number(params['aforo']),
          params['fechaInicio']
        );
      }
      else if (params['ubicacion'] && params['tipoEvento'] && params['fechaInicio'] && params['fechaFin'] && params['aforoMin'] && params['aforoMax'] && params['presupuestoMin'] && params['presupuestoMax']) {
        this.buscarEventosAvanzada(
          Number(params['ubicacion']),
          Number(params['tipoEvento']),
          params['fechaInicio'],
          params['fechaFin'],
          Number(params['aforoMin']),
          Number(params['aforoMax']),
          Number(params['presupuestoMin']),
          Number(params['presupuestoMax']),
        );
      }
    });
    this.cargarChats(this.idAnfitrion);
    this.chatListPollingInterval = setInterval(() => {
      this.cargarChats(this.idAnfitrion);
    }, 1000);
  }
  ngOnDestroy(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    if (this.chatListPollingInterval) {
      clearInterval(this.chatListPollingInterval);
    }
  }
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  toggleChat(): void {
    this.chatVisible = !this.chatVisible;
    if (!this.chatVisible) {
      this.activeChatName = null;
      this.activeChatAvatar = null;
    }
  }
  selectChat(nombre: string | null, avatar: string | null, idChat?: number) {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    this.activeChatId = idChat ?? null;
    this.activeChatName = nombre;
    this.activeChatAvatar = avatar ?? '/assets/default.png';

    if (this.activeChatId !== null) {
      this.cargarMensajes(true);
      this.pollingInterval = setInterval(() => {
        this.cargarMensajes(false);
      }, 1000);
    } else {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
      }
    }
  }
  cargarMensajes(forzarScroll: boolean) {
    if (!this.activeChatId) return;
    const conteoActual = this.mensajes.length;
    this.mensajeService.listarPorChat(this.activeChatId).subscribe({
      next: (res: Mensaje[]) => {
        this.mensajes = res;
        if (forzarScroll || this.mensajes.length !== conteoActual) {
          setTimeout(() => this.scrollBottom(), 50);
        }
      },
      error: (err) => console.error("Error al cargar mensajes:", err)
    });
  }
  enviarMensaje() {
    if (!this.mensajeTexto.trim() || !this.activeChatId) return;

    const nuevoMsg: Mensaje = {
      contenido: this.mensajeTexto,
      fechaenvio: new Date(),
      chat: { id: this.activeChatId } as Chat
    };

    this.mensajeService.enviar(this.activeChatId, nuevoMsg).subscribe({
      next: (msgCreado: any) => {
        msgCreado.esPropio = true;
        this.mensajes.push(msgCreado);
        this.mensajeTexto = '';
        setTimeout(() => this.scrollBottom(), 50);
      }
    });
  }
  scrollBottom() {
    try {
      this.scrollContainer.nativeElement.scrollTop =
        this.scrollContainer.nativeElement.scrollHeight;
    } catch {}
  }
  cargarChats(idAnfitrion: number) {
    this.chatService.listarPorAnfitrion(idAnfitrion).subscribe({
      next: (data: Chat[]) => {
        this.chats = data.map(chat => ({
          ...chat,
          proveedor: {
            ...chat.proveedor,
            foto: chat.proveedor.foto?.startsWith('data:')
              ? chat.proveedor.foto
              : `data:image/png;base64,${chat.proveedor.foto}`
          }
        }));
        console.log("Chats cargados:", this.chats);
      },
      error: (err) => console.error("Error al cargar chats:", err)
    });
  }
  buscarEventosAvanzada(distrito: number, tipoEvento: number, fechaInicio: string, fechaFin: string, aforoMin: number, aforoMax: number, presupuestoMin: number, presupuestoMax: number) {
    const fecha1: Date = new Date(fechaInicio);
    const fecha2: Date = new Date(fechaFin);
    this.eventoService.listarFiltroAvanzado(distrito, tipoEvento, fecha1, fecha2, aforoMin, aforoMax, presupuestoMin, presupuestoMax).subscribe({
      next: (data) =>{
        this.eventosFiltradosAvanzados = data;
        this.eventosFiltradosAvanzados.forEach(evento => {
          if (evento.id != null) {
            this.cargarImagenesPorEvento(evento.id);
          }
        });
        console.log('Eventos filtrados:', this.eventosFiltradosAvanzados);
      },
      error: (err) => console.error('Error al buscar eventos filtrados:', err)
    })
  }
  buscarEventosBasico(distrito: number, aforo: number, fechaInicio: string): void {
    const fecha: Date = new Date(fechaInicio);
    console.log(fecha);
    this.eventoService.listarFiltroBasico(distrito, aforo, fecha).subscribe({
      next: (data) => {
        this.eventosFiltrados = data;
        this.eventosFiltrados.forEach(evento => {
          if (evento.id != null) {
            this.cargarImagenesPorEvento(evento.id);
          }
        });
        console.log('Eventos filtrados:', this.eventosFiltrados);
      },
      error: (err) => console.error('Error al buscar eventos filtrados:', err)
    });
  }
  cargarImagenesPorEvento(idEvento: number) {
    this.imagenEventoService.listarPorIdEvento(idEvento).subscribe({
      next: (imagenes: ImagenEvento[]) => {
        if (imagenes && imagenes.length > 0) {
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
      return '/assets/Group%20633475.png';
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
