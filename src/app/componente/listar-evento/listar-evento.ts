import {ChangeDetectorRef, Component, ElementRef, inject, ViewChild} from '@angular/core';
import {CalendarComponent} from '../../../../../../../Downloads/Celebra FrontEnd - copia/Celebra FrontEnd - copia/src/app/componente/calendario/calendar';
import {FormBuilder, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {Evento} from '../../../../../../../Downloads/Celebra FrontEnd - copia/Celebra FrontEnd - copia/src/app/model/evento';
import {ImagenEvento} from '../../../../../../../Downloads/Celebra FrontEnd - copia/Celebra FrontEnd - copia/src/app/model/imagenEvento';
import {TipoEvento} from '../../../../../../../Downloads/Celebra FrontEnd - copia/Celebra FrontEnd - copia/src/app/model/tipoEvento';
import {Distrito} from '../../../../../../../Downloads/Celebra FrontEnd - copia/Celebra FrontEnd - copia/src/app/model/distrito';
import {Ciudad} from '../../../../../../../Downloads/Celebra FrontEnd - copia/Celebra FrontEnd - copia/src/app/model/ciudad';
import {DistritoServices} from '../../../../../../../Downloads/Celebra FrontEnd - copia/Celebra FrontEnd - copia/src/app/services/distrito-services';
import {CiudadServices} from '../../../../../../../Downloads/Celebra FrontEnd - copia/Celebra FrontEnd - copia/src/app/services/ciudad-services';
import {ImagenEventoService} from '../../../../../../../Downloads/Celebra FrontEnd - copia/Celebra FrontEnd - copia/src/app/services/imagenEvento-services';
import {EventoService} from '../../../../../../../Downloads/Celebra FrontEnd - copia/Celebra FrontEnd - copia/src/app/services/evento-services';
import {ProveedorServices} from '../../../../../../../Downloads/Celebra FrontEnd - copia/Celebra FrontEnd - copia/src/app/services/proveedor-services';
import {TipoEventoServices} from '../../../../../../../Downloads/Celebra FrontEnd - copia/Celebra FrontEnd - copia/src/app/services/tipo-evento-services';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {Proveedor} from '../../../../../../../Downloads/Celebra FrontEnd - copia/Celebra FrontEnd - copia/src/app/model/proveedor';
import {debounceTime, fromEvent} from 'rxjs';
import {DatePipe} from '@angular/common';
import {Mensaje} from '../../../../../../../Downloads/Celebra FrontEnd - copia/Celebra FrontEnd - copia/src/app/model/mensaje';
import {MensajeServices} from '../../../../../../../Downloads/Celebra FrontEnd - copia/Celebra FrontEnd - copia/src/app/services/mensaje-services';
import {Chat} from '../../../../../../../Downloads/Celebra FrontEnd - copia/Celebra FrontEnd - copia/src/app/model/chat';
import {ChatServices} from '../../../../../../../Downloads/Celebra FrontEnd - copia/Celebra FrontEnd - copia/src/app/services/chat-services';

@Component({
  selector: 'app-listar-evento',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
  ],
  templateUrl: './listar-evento.html',
  styleUrl: './listar-evento.css',
})
export class ListarEvento {
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
  mostrarFiltrosAvanzados = false;
  menuPerfilActivo = false;
  menuActivo = false;
  animando = false;
  mostrarCerrarSesion = false;
  mostrarModalEliminar = false;
  evento: Evento[] = [];
  imagenesEvento: ImagenEvento[] = [];
  tipoEvento: TipoEvento[] = [];
  distrito: Distrito[] = [];
  ciudad: Ciudad[] = [];
  indices: { [key: number]: number } = {};
  indicePrevio: { [key: number]: number } = {};
  intervalos: { [key: string]: any } = {};
  haIniciadoAnimacion: { [key: number]: boolean } = {};
  proveedor: Proveedor;
  eventoService: EventoService = inject(EventoService);
  distritoService: DistritoServices = inject(DistritoServices);
  ciudadService: CiudadServices = inject(CiudadServices);
  imagenEventoService = inject(ImagenEventoService);
  proveedorService: ProveedorServices = inject(ProveedorServices);
  tipoEventoService: TipoEventoServices = inject(TipoEventoServices);
  route: ActivatedRoute = inject(ActivatedRoute);
  router: Router = inject(Router);
  alturaTotalContenido = 0;
  eventoSeleccionadoId!: number;
  barraHeight = 45;
  scrollPosition = 0;
  opacidadSuperior = 0;
  opacidadInferior = 0;
  private fb: FormBuilder = inject(FormBuilder);
  constructor(private cdr: ChangeDetectorRef) {}
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
        this.proveedor.foto = 'data:image/png;base64,' + this.proveedor.foto;
        console.log('Proveedor cargado:', this.proveedor);
      },
      error: (err) => {
        console.error('Error al obtener proveedor:', err);
        alert('No se pudo obtener el proveedor.');
      }
    });
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
    this.cargarEventos(idProveedor);
    this.cargarChats(idProveedor);
    this.chatListPollingInterval = setInterval(() => {
      this.cargarChats(idProveedor);
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
  cargarChats(idProveedor: number) {
    this.chatService.listarPorProveedor(idProveedor).subscribe({
      next: (data: Chat[]) => {
        this.chats = data.map(chat => ({
          ...chat,
          anfitrion: {
            ...chat.anfitrion,
            foto: chat.anfitrion.foto?.startsWith('data:')
              ? chat.anfitrion.foto
              : `data:image/png;base64,${chat.anfitrion.foto}`
          }
        }));
        console.log("Chats cargados:", this.chats);
      },
      error: (err) => console.error("Error al cargar chats:", err)
    });
  }
  cargarEventos(idProveedor: number): void {
    this.eventoService.listarPorIdProveedor(idProveedor).subscribe({
      next: (data) => {
        this.evento = data.filter(e => e.estado !== "Eliminado");
        console.log('Eventos cargados:', this.evento);
        this.evento.forEach(evento => {
          if (evento.id != null) {
            this.cargarImagenesPorEvento(evento.id);
          }
        });
        setTimeout(() => {
          this.evento.forEach(e => this.iniciarCarrusel(e.id!));
        }, 1000);
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
          this.imagenesEvento = this.imagenesEvento.concat(imagenes);
          this.indices[idEvento] = 0;
          this.indicePrevio[idEvento] = 0;
          this.iniciarCarrusel(idEvento);
        }
      },
      error: (err) => console.error(`Error al cargar imágenes del evento ${idEvento}:`, err)
    });
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
  cerrarMenu(menu: Element, boton: Element) {
    menu.classList.remove('activo');
    menu.classList.add('saliendo');
    boton.classList.remove('activo');
    this.menuActivo = false;
  }
  iniciarCarrusel(idEvento: number) {
    const imagenes = this.obtenerImagenesPorEvento(idEvento);
    if (!imagenes || imagenes.length <= 1) return;

    // Inicialización limpia (sin animación)
    this.indices[idEvento] = 0;
    this.indicePrevio[idEvento] = -1;
    this.haIniciadoAnimacion[idEvento] = true;

    // Sincronizar arranque en un solo tiempo global
    if (!this.intervalos['GLOBAL']) {
      this.intervalos['GLOBAL'] = setInterval(() => {
        this.actualizarCarruseles();
      }, 3000);
    }
  }
  obtenerImagenPorEvento(idEvento: number): string {
    const imagenEncontrada = this.imagenesEvento.find(img => img.evento.id === idEvento);
    if (imagenEncontrada && imagenEncontrada.imagen) {
      const base64 = imagenEncontrada.imagen.trim();
      let mimeType = 'image/jpeg';
      if (base64.startsWith('iVBOR')) mimeType = 'image/png';
      else if (base64.startsWith('/9j/')) mimeType = 'image/jpeg';
      return `data:${mimeType};base64,${base64}`;
    }
    return '/assets/Group%20633475.png';
  }
  actualizarCarruseles() {
    for (const idEvento in this.indices) {
      const imagenes = this.obtenerImagenesPorEvento(Number(idEvento));
      if (!imagenes || imagenes.length <= 1) continue;

      const actual = this.indices[idEvento];
      const siguiente = (actual + 1) % imagenes.length;

      // Desde la segunda transición → animación normal
      this.indicePrevio[idEvento] = actual;
      this.indices[idEvento] = siguiente;
    }

    this.cdr.detectChanges();
  }
  obtenerImagenesPorEvento(idEvento: number): ImagenEvento[] {
    return this.imagenesEvento.filter(img => img.evento.id === idEvento);
  }
  getImagenSrc(base64: string): string {
    if (!base64) return '/assets/placeholder.png';
    const trimmed = base64.trim();
    // Si el string base64 comienza con el encabezado 'data:image', ya está completo
    if (trimmed.startsWith('data:image')) {
      return trimmed;
    }
    // Detectar el tipo de imagen según los primeros caracteres del base64
    if (trimmed.startsWith('/9j/')) {
      return 'data:image/jpeg;base64,' + trimmed; // JPG
    }
    if (trimmed.startsWith('iVBOR')) {
      return 'data:image/png;base64,' + trimmed; // PNG
    }
    // Por defecto, asume JPG
    return 'data:image/jpeg;base64,' + trimmed;
  }
  onScroll() {
    this.cdr.detectChanges();
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
  abrirModalEliminar(id: number) {
    this.eventoSeleccionadoId = id;
    this.mostrarModalEliminar = true;
  }
  cerrarModalEliminar() {
    this.mostrarModalEliminar = false;
  }
  confirmarEliminar() {
    if (!this.eventoSeleccionadoId) return;
    this.eventoService.eliminar(this.eventoSeleccionadoId).subscribe({
      next: () => {
        console.log("✅ Evento eliminado:", this.eventoSeleccionadoId);
        this.evento = this.evento.filter(e => e.id !== this.eventoSeleccionadoId);
        this.imagenesEvento = this.imagenesEvento.filter(img => img.evento.id !== this.eventoSeleccionadoId);
        this.mostrarModalEliminar = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("❌ Error al eliminar evento:", err);
        alert("No se pudo eliminar el evento.");
      }
    });
  }
  irEditarEvento(idProveedor: number, idEvento: number) {
    this.router.navigate(['/crear-evento/evento', idProveedor, idEvento]);
  }
}
