import {
  AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, inject, NgZone, OnInit, ViewChild
} from '@angular/core';
import {DatePipe, NgOptimizedImage} from '@angular/common';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {Proveedor} from '../../../../../../../Downloads/Celebra FrontEnd - copia/Celebra FrontEnd - copia/src/app/model/proveedor';
import {ProveedorServices} from '../../../../../../../Downloads/Celebra FrontEnd - copia/Celebra FrontEnd - copia/src/app/services/proveedor-services';
import {ContratoEventoServices} from '../../../../../../../Downloads/Celebra FrontEnd - copia/Celebra FrontEnd - copia/src/app/services/contrato-evento-services';
import {ContratoEvento} from '../../../../../../../Downloads/Celebra FrontEnd - copia/Celebra FrontEnd - copia/src/app/model/contratoEvento';
import {ImagenEvento} from '../../../../../../../Downloads/Celebra FrontEnd - copia/Celebra FrontEnd - copia/src/app/model/imagenEvento';
import {ImagenEventoService} from '../../../../../../../Downloads/Celebra FrontEnd - copia/Celebra FrontEnd - copia/src/app/services/imagenEvento-services';
import {debounceTime, fromEvent} from 'rxjs';
import {Mensaje} from '../../../../../../../Downloads/Celebra FrontEnd - copia/Celebra FrontEnd - copia/src/app/model/mensaje';
import {MensajeServices} from '../../../../../../../Downloads/Celebra FrontEnd - copia/Celebra FrontEnd - copia/src/app/services/mensaje-services';
import {Chat} from '../../../../../../../Downloads/Celebra FrontEnd - copia/Celebra FrontEnd - copia/src/app/model/chat';
import {ChatServices} from '../../../../../../../Downloads/Celebra FrontEnd - copia/Celebra FrontEnd - copia/src/app/services/chat-services';

@Component({
  selector: 'app-menu-proveedor',
  imports: [
    ReactiveFormsModule,
    NgOptimizedImage,
    RouterLink,
    DatePipe,
    FormsModule
  ],
  templateUrl: './menu-proveedor.html',
  styleUrl: './menu-proveedor.css',
})
export class MenuProveedor{
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
  proveedor: Proveedor;
  buscarForm: FormGroup;
  buscarAvanzadaForm: FormGroup;
  mostrarFiltrosAvanzados = false;
  menuPerfilActivo = false;
  menuActivo = false;
  animando = false;
  scrollPosition = 0;
  barraHeight = 70;
  alturaTotalContenido = 0;
  mostrarCerrarSesion = false;
  imagenesEvento: { [idEvento: number]: ImagenEvento[] } = {};
  indices: { [key: number]: number } = {};
  indicePrevio: { [key: number]: number } = {};
  intervalos: { [key: number]: any } = {};
  zone: NgZone = inject(NgZone);
  contratoEventoService = inject(ContratoEventoServices);
  imagenEventoService: ImagenEventoService = inject(ImagenEventoService);
  imagenEvento: ImagenEvento[] = [];
  contratoEvento: ContratoEvento[] = [];
  proveedorService: ProveedorServices = inject(ProveedorServices);
  route: ActivatedRoute = inject(ActivatedRoute);
  private fb: FormBuilder = inject(FormBuilder);
  constructor(private cdr: ChangeDetectorRef) {}
  ngOnInit(): void {
    const idParam = this.route.snapshot.params['id'];
    const id = Number(idParam);
    this.cargarProveedor(id);
    this.buscarForm = this.fb.group({
      Distrito: ['', Validators.required],
      Aforo: ['', Validators.required],
      Fecha: ['', Validators.required],
    });
    this.buscarAvanzadaForm = this.fb.group({
      UbicacionAvanzada: ['', Validators.required],
      TipoEventoAvanzada: ['', Validators.required],
      FechaInicioAvanzada: ['', Validators.required],
      FechaFinAvanzada: ['', Validators.required],
      AforoAvanzadaMin: ['', Validators.required],
      AforoAvanzadaMax: ['', Validators.required],
      PresupuestoAvanzadaMin: ['', Validators.required],
      PresupuestoAvanzadaMax: ['', Validators.required],
    });
    setTimeout(() => {
      this.cargarContratos(id);
    });
    this.cargarChats(id);
    this.chatListPollingInterval = setInterval(() => {
      this.cargarChats(id);
    }, 1000);
  }
  ngOnDestroy(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    if (this.chatListPollingInterval) {
      clearInterval(this.chatListPollingInterval);
    }
    console.log('Destruyendo componente y limpiando intervalos...');
    this.limpiarIntervalos();
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
  cargarContratos(id: number): void {
    this.limpiarIntervalos();
    this.imagenesEvento = {};
    this.indices = {};
    this.indicePrevio = {};

    this.contratoEventoService.verContratosContratadosPorIdProveedor(id).subscribe({
      next: (data) => {
        this.contratoEvento = data;
        console.log(`Contratos cargados:`, this.contratoEvento.length);

        this.contratoEvento.forEach(contrato => {
          if (contrato.evento && contrato.evento.id) {
            this.cargarImagenesPorEvento(contrato.evento.id);
          }
        });
      },
      error: (err) => console.error('Error al cargar contratos', err)
    });
  }
  limpiarIntervalos() {
    for (const key in this.intervalos) {
      if (this.intervalos.hasOwnProperty(key)) {
        clearInterval(this.intervalos[key]);
      }
    }
    this.intervalos = {};
  }
  cargarImagenesPorEvento(idEvento: number) {
    this.imagenEventoService.listarPorIdEvento(idEvento).subscribe({
      next: (imagenes: ImagenEvento[]) => {
        if (!imagenes || imagenes.length === 0) {
          this.imagenesEvento = { ...this.imagenesEvento, [idEvento]: [] };
          this.cdr.detectChanges();
          return;
        }

        const normalizadas = imagenes.map(img => {
          // ... (tu normalización está bien)
          const raw = (img as any).imagenEvento || img.imagen || '';
          let imagenFinal = '';
          if (raw && typeof raw === 'string') {
            imagenFinal = raw.startsWith('data:image') ? raw : 'data:image/png;base64,' + raw;
          }
          return { ...img, imagen: imagenFinal };
        });

        // Actualización inmutable (esto ya está bien)
        this.imagenesEvento = {
          ...this.imagenesEvento,
          [idEvento]: normalizadas
        };

        // Configuramos el índice inicial (Visible inmediatamente)
        if (this.indices[idEvento] === undefined) {

          // *** CAMBIO AQUÍ: Recrear los objetos ***
          this.indices = {
            ...this.indices,
            [idEvento]: 0
          };
          this.indicePrevio = {
            ...this.indicePrevio,
            [idEvento]: -1
          };
        }

        console.log("RESpuesta del backend:", imagenes);
        this.cdr.detectChanges(); // Correcto, para pintar la primera imagen
        this.iniciarCarrusel(idEvento); // Correcto, para arrancar el intervalo
      },
      error: (err) => console.error(`Error imágenes evento ${idEvento}:`, err),
    });
  }
  iniciarCarrusel(idEvento: number) {
    if (this.intervalos[idEvento]) {
      clearInterval(this.intervalos[idEvento]);
    }

    this.zone.runOutsideAngular(() => {
      this.intervalos[idEvento] = window.setInterval(() => {
        this.zone.run(() => {
          const imgs = this.imagenesEvento[idEvento];
          if (!imgs || imgs.length <= 1) return;

          const total = imgs.length;
          const indiceActual = this.indices[idEvento];
          const indiceSiguiente = (indiceActual + 1) % total;

          // *** ESTE ES EL CAMBIO CRÍTICO ***

          // ▼▼ ESTO ES MUTACIÓN (LO QUE TIENES AHORA) ▼▼
          // this.indicePrevio[idEvento] = indiceActual;
          // this.indices[idEvento] = indiceSiguiente;

          // ▼▼ ESTA ES LA SOLUCIÓN (INMUTABILIDAD) ▼▼
          // Al crear un objeto nuevo, Angular detecta el cambio sí o sí.
          this.indicePrevio = {
            ...this.indicePrevio,
            [idEvento]: indiceActual
          };
          this.indices = {
            ...this.indices,
            [idEvento]: indiceSiguiente
          };

          // Ya no necesitas cdr.detectChanges(),
          // this.zone.run() se encarga.
        });

      }, 3000);
    });
  }

  cargarProveedor(id: number): void {
    this.proveedorService.listarPorId(id).subscribe({
      next: (data) => {
        this.proveedor = data;
        this.proveedor.foto = 'data:image/png;base64,' + this.proveedor.foto;
        console.log('Proveedor cargado:', this.proveedor);
      },
      error: (err) => {
        console.error('Error al cargar el proveedor', err);
      }
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
  @ViewChild('listaHistorial') listaEventos!: ElementRef;
  opacidadSuperior = 0;
  opacidadInferior = 0;
  ngAfterViewInit() {
    this.calcularAlturaTotal();
    if (this.listaEventos?.nativeElement) {
      const lista = this.listaEventos.nativeElement;
      fromEvent(lista, 'scroll')
        .pipe(debounceTime(5))
        .subscribe(() => this.actualizarPosicionBarra());
    }
  }
  calcularAlturaTotal() {
    if (this.listaEventos?.nativeElement) {
      // Adaptamos el selector al de la plantilla de proveedor
      const eventosElements = this.listaEventos.nativeElement.querySelectorAll('.evento-card');
      let alturaAcumulada = 0;
      eventosElements.forEach((elemento: HTMLElement) => {
        alturaAcumulada += elemento.offsetHeight + 20; // Asumimos un 'gap' de 20px
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

    // Busca la barra-1 en el DOM (basado en la lógica original)
    const barra1 = document.querySelector('.barra-1') as HTMLElement;
    if (!barra1) return;

    const alturaBarra1 = barra1.clientHeight;
    const espacioMaximoScrollableBarra = Math.max(0, alturaBarra1 - this.barraHeight);

    if (totalScrollable > 0) {
      const scrollPercent = scrollTop / totalScrollable;
      // La nueva posición de la barra-2 se calcula sobre el "espacioMaximoScrollableBarra"
      const targetPos = scrollPercent * espacioMaximoScrollableBarra;
      this.scrollPosition = Math.min(espacioMaximoScrollableBarra, Math.max(0, targetPos));
    } else {
      this.scrollPosition = 0;
    }

    // Lógica de opacidad (fade) que estaba en el original
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

    // *** CAMBIO CLAVE AQUÍ ***
    // Usamos la altura de barra-1 y la altura de barra-2 para calcular el espacio de arrastre
    const barra1 = wrapper.querySelector('.barra-1') as HTMLElement; // Asegurarse de obtener barra-1 dentro del wrapper
    if (!barra1) return;
    const alturaBarra1 = barra1.clientHeight;
    const espacioMaximoArrastreBarra = Math.max(0, alturaBarra1 - this.barraHeight);

    const startY = event.clientY;
    const startScrollPos = this.scrollPosition;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      let nuevaPosicion = startScrollPos + deltaY;

      // Asegurarse de que no exceda el espacio máximo de arrastre
      nuevaPosicion = Math.min(espacioMaximoArrastreBarra, Math.max(0, nuevaPosicion));
      this.scrollPosition = nuevaPosicion;

      if (this.listaEventos?.nativeElement) {
        const lista = this.listaEventos.nativeElement;
        const totalScrollable = lista.scrollHeight - lista.clientHeight;
        if (totalScrollable > 0) {
          // La proporción de scroll se calcula sobre el "espacioMaximoArrastreBarra"
          const newScrollTop = (nuevaPosicion / espacioMaximoArrastreBarra) * totalScrollable;
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

    return 0.3 + 0.7 * ratio; // 0.3 opacidad base + 0.7 variable
  }
  onScroll() {
    this.cdr.detectChanges();
  }
}
