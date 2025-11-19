import {ChangeDetectorRef, Component, ElementRef, HostListener, inject, ViewChild} from '@angular/core';
import {DatePipe, NgOptimizedImage} from '@angular/common';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {Proveedor} from '../../model/proveedor';
import {Anfitrion} from '../../model/anfitrion';
import {AnfitrionServices} from '../../services/anfitrion-services';
import {ProveedorServices} from '../../services/proveedor-services';
import {DistritoServices} from '../../services/distrito-services';
import {Distrito} from '../../model/distrito';
import {Ciudad} from '../../model/ciudad';
import {TipoEvento} from '../../model/tipoEvento';
import {CiudadServices} from '../../services/ciudad-services';
import {TipoEventoServices} from '../../services/tipo-evento-services';
import {Mensaje} from '../../model/mensaje';
import {MensajeServices} from '../../services/mensaje-services';
import {Chat} from '../../model/chat';
import {ChatServices} from '../../services/chat-services';
@Component({
  selector: 'app-centro-ayuda',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    NgOptimizedImage,
    DatePipe,
    FormsModule
  ],
  templateUrl: './centro-ayuda.html',
  styleUrl: './centro-ayuda.css',
})
export class CentroAyuda {
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
  buscarForm: FormGroup;
  buscarAvanzadaForm: FormGroup;
  buscarFormAyuda: FormGroup;
  mostrarFiltrosAvanzados = false;
  menuPerfilActivo = false;
  menuActivo = false;
  animando = false;
  mostrarCerrarSesion = false;
  proveedor: Proveedor;
  anfitrion: Anfitrion;
  ciudad: Ciudad[] = [];
  tipoEvento: TipoEvento[] = [];
  ciudadService: CiudadServices = inject(CiudadServices);
  tipoEventoService: TipoEventoServices = inject(TipoEventoServices);
  distritoService: DistritoServices = inject(DistritoServices);
  router: Router = inject(Router);
  distrito: Distrito[] = [];
  anfitrionService: AnfitrionServices = inject(AnfitrionServices);
  proveedorService: ProveedorServices = inject(ProveedorServices);
  usuario: Anfitrion | Proveedor;
  private route = inject(ActivatedRoute);
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
    this.buscarFormAyuda = this.fb.group({
      Buscar: ['', Validators.required],
    })
    this.distritoService.listar().subscribe({
      next: (data) => this.distrito = data,
      error: (err) => console.error('Error al cargar los distritos', err)
    })
  }
  ngOnInit(): void {
    const id = Number(this.route.snapshot.params['id']);
    const role = this.route.snapshot.params['role'];
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
    if (role === 'ROLE_ANFITRION') {
      this.anfitrionService.listarPorId(id).subscribe({
        next: (a) => { this.anfitrion = a;
          if (a.role?.name === 'ROLE_ANFITRION') {
            this.anfitrion = a;
            if (this.anfitrion.foto) {
              this.anfitrion.foto = 'data:image/png;base64,' + this.anfitrion.foto;
            }
            this.usuario = a;
          }
        }
      });
    } else if (role === 'ROLE_PROVEEDOR') {
      this.proveedorService.listarPorId(id).subscribe({
        next: (p) => { this.proveedor = p;
          if (p.role?.name === 'ROLE_PROVEEDOR') {
            this.proveedor = p;
            if (this.proveedor.foto) {
              this.proveedor.foto = 'data:image/png;base64,' + this.proveedor.foto;
            }
            this.usuario = p;
          }
        },
        error: (err) => console.error('Error al cargar proveedor:', err)
      });
    }
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
  cargarChats(id: number) {
    if (this.usuario == this.anfitrion){
      this.chatService.listarPorAnfitrion(id).subscribe({
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
    else if (this.usuario == this.proveedor){
      this.chatService.listarPorProveedor(id).subscribe({
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
