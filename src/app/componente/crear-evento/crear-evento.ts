import {ChangeDetectorRef, Component, ElementRef, HostListener, inject, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {Proveedor} from '../../model/proveedor';
import {ProveedorServices} from '../../services/proveedor-services';
import {CalendarComponent} from '../calendario/calendar';
import {Evento} from '../../model/evento';
import {EventoService} from '../../services/evento-services';
import {ImagenEvento} from '../../model/imagenEvento';
import {ImagenEventoService} from '../../services/imagenEvento-services';
import {TipoEvento} from '../../model/tipoEvento';
import {TipoEventoServices} from '../../services/tipo-evento-services';
import {Distrito} from '../../model/distrito';
import {Ciudad} from '../../model/ciudad';
import {DistritoServices} from '../../services/distrito-services';
import {CiudadServices} from '../../services/ciudad-services';
import {firstValueFrom, forkJoin, Observable} from 'rxjs';
import {DatePipe} from '@angular/common';
import {Mensaje} from '../../model/mensaje';
import {MensajeServices} from '../../services/mensaje-services';
import {Chat} from '../../model/chat';
import {ChatServices} from '../../services/chat-services';
import {LoginService} from '../../services/login-service';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {BotpressService} from '../../services/botpress-service';

@Component({
  selector: 'app-crear-evento',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    CalendarComponent,
    DatePipe,
    FormsModule,
    TranslatePipe,
  ],
  templateUrl: './crear-evento.html',
  styleUrl: './crear-evento.css',
})
export class CrearEvento {
  activeChatTitle: string | null = null;
  loginService: LoginService = inject(LoginService);
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
  crearForm: FormGroup;
  mostrarFiltrosAvanzados = false;
  menuPerfilActivo = false;
  menuActivo = false;
  animando = false;
  mostrarCerrarSesion = false;
  previewUrl: string | ArrayBuffer | null = null;
  selectedFileBase64: string | null = null;
  initialStart: Date | null = null;
  initialEnd: Date | null = null;
  evento: Evento;
  imagenEvento: ImagenEvento[] = [];
  tipoEvento: TipoEvento[] = [];
  distrito: Distrito[] = [];
  ciudad: Ciudad[] = [];
  imagenesPrevias: string[] = [];
  imagenesOriginales: { id: number; base64: string }[] = [];
  imagenesAEliminar: number[] = [];
  fechaInicio: Date | null = null;
  fechaFin: Date | null = null;
  imagenesPreview: string[] = [];
  imagenesServer: { id: number | undefined; base64: string }[] = [];
  currentUploadIndex: number | null = null;
  distritosFiltrados: Distrito[] = [];
  distritoService: DistritoServices = inject(DistritoServices);
  ciudadService: CiudadServices = inject(CiudadServices);
  imagenEventoService = inject(ImagenEventoService);
  eventoService: EventoService = inject(EventoService);
  proveedorService: ProveedorServices = inject(ProveedorServices);
  tipoEventoService: TipoEventoServices = inject(TipoEventoServices);
  route: ActivatedRoute = inject(ActivatedRoute);
  router: Router = inject(Router);
  private fb: FormBuilder = inject(FormBuilder);
  translate: TranslateService = inject(TranslateService);
  botpressService: BotpressService = inject(BotpressService);
  constructor(private cdr: ChangeDetectorRef) {
    this.crearForm = this.fb.group({
      Nombre: ['', Validators.required],
      FechaInicio: ['', Validators.required],
      FechaFin: ['', Validators.required],
      Aforo: ['', Validators.required],
      Descripcion: ['', Validators.required],
      Presupuesto: ['', Validators.required],
      TipoEvento: ['', Validators.required],
      Ciudad: ['', Validators.required],
      Distrito: ['', Validators.required],
      aceptarTerminos: [false]
    });
  }
  ngOnInit(): void {
    this.botpressService.destroyChat();
    this.translate.addLangs(['es', 'en', 'pt', 'zh', 'ja']);
    this.translate.setDefaultLang('es');
    this.translate.use(localStorage.getItem('lang') ?? 'es');
    this.imagenesPreview = ['/assets/Group%20633475.png'];
    const idProveedor = Number(this.route.snapshot.params['idProveedor']);
    const idEvento = Number(this.route.snapshot.params['idEvento']);
    this.proveedorService.listarPorId(idProveedor).subscribe({
      next: (data) => {
        this.proveedor = data;
        if (this.proveedor.foto && !this.proveedor.foto.startsWith('data:')) {
          this.proveedor.foto = 'data:image/png;base64,' + this.proveedor.foto;
        }
      },
      error: () => alert('No se pudo obtener el proveedor.')
    });
    Promise.all([
      firstValueFrom(this.ciudadService.listar()),
      firstValueFrom(this.distritoService.listar()),
      firstValueFrom(this.tipoEventoService.listar())
    ]).then(([ciudades, distritos, tiposEvento]) => {
      this.ciudad = ciudades ?? [];
      this.distrito = distritos ?? [];
      this.tipoEvento = tiposEvento ?? [];
      if (idEvento) {
        this.cargarEvento(idEvento);
        this.cargarImagenesEvento(idEvento);
        this.cdr.detectChanges();
      }
    })
      .catch(err => console.error("Error cargando datos:", err));
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
      this.activeChatTitle = null;
    }
  }
  selectChat(nombre: string | null, avatar: string | null, titulo: string | null, idChat?: number) {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    this.activeChatId = idChat ?? null;
    this.activeChatName = nombre;
    this.activeChatAvatar = avatar ?? '/assets/default.png';
    this.activeChatTitle = titulo;

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
  cargarEvento(idEvento: number) {
    this.eventoService.listarPorId(idEvento).subscribe({
      next: (data) => {
        console.log('Evento recibido del backend:', data);
        this.evento = data;
        const inicio = data.fechainicio ? new Date(data.fechainicio) : null;
        const fin = data.fechafin ? new Date(data.fechafin) : null;
        this.fechaInicio = this.normalize(inicio);
        this.fechaFin = this.normalize(fin);
        this.initialStart = this.fechaInicio;
        this.initialEnd = this.fechaFin;
        this.crearForm.patchValue({
          Nombre: data.titulo,
          Descripcion: data.descripcion,
          Presupuesto: data.presupuesto,
          Aforo: data.aforo,
          FechaInicio: this.fechaInicio,
          FechaFin: this.fechaFin
        });
        if (data.tipoevento?.id) {
          this.crearForm.patchValue({ TipoEvento: data.tipoevento.id });
        }
        if (data.distrito?.ciudad?.id) {
          this.crearForm.patchValue({ Ciudad: data.distrito.ciudad.id });
          this.filtrarDistritos();
          if (data.distrito?.id) {
            this.crearForm.patchValue({ Distrito: data.distrito.id });
          }
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando el evento:', err);
        alert('Error al cargar los datos del evento.');
        window.history.back();
      }
    });
  }
  cargarImagenesEvento(idEvento: number) {
    console.log('cargarImagenesEvento() fue llamado con idEvento =', idEvento);
    this.imagenEventoService.listarPorIdEvento(idEvento).subscribe({
      next: (imagenes: any[]) => {
        imagenes.forEach((img: any, index: number) => {
          console.log(`\n%c[IMAGEN ${index + 1}]`, 'color: #ff00ff; font-weight: bold;');
          if (!img) {
            console.warn('Imagen nula o indefinida');
            return;
          }
          console.log('Objeto recibido:', JSON.parse(JSON.stringify(img)));
          const posiblesCampos = ['imagen', 'image', 'base64', 'bytes', 'data', 'contenido'];
          let encontrado: any = null;

          for (const campo of posiblesCampos) {
            if (campo in img) {
              encontrado = img[campo];
              console.log(`Campo detectado: "${campo}"`);
              break;
            }
          }
          if (!encontrado) {
            console.warn('No se encontró ningún campo de imagen en este objeto.');
            return;
          }
          if (Array.isArray(encontrado)) {
            console.log(`Tipo: byte[] (${encontrado.length} bytes)`);
          }
          if (typeof encontrado === 'string') {
            console.log('Tipo: string');
            console.log('Primeros 80 chars:', encontrado.substring(0, 80));
          }
          if (typeof encontrado === 'object' && !Array.isArray(encontrado)) {
            console.log('Tipo: objeto');
            console.log('Contenido keys:', Object.keys(encontrado));
          }
        });
        this.imagenesPreview = [];
        this.imagenesServer = [];
        if (!imagenes || imagenes.length === 0) {
          this.imagenesPreview.push('/assets/Group%20633475.png');
          this.cdr.detectChanges();
          return;
        }
        const toBase64 = (value: any): string | null => {
          if (!value && value !== 0) return null;
          if (typeof value === 'string') {
            if (value.startsWith('data:image')) return value.split(',')[1];
            return value.replace(/\s/g, '');
          }
          if (Array.isArray(value) || (typeof Uint8Array !== 'undefined' && value instanceof Uint8Array)) {
            try {
              const uint8 = new Uint8Array(value);
              let CHUNK_SIZE = 0x8000;
              let index = 0;
              let binary = '';
              while (index < uint8.length) {
                const slice = uint8.subarray(index, Math.min(index + CHUNK_SIZE, uint8.length));
                binary += String.fromCharCode.apply(null, Array.from(slice));
                index += CHUNK_SIZE;
              }
              return btoa(binary);
            } catch (e) {
              console.error('Error convirtiendo Array->base64:', e);
              return null;
            }
          }
          if (typeof value === 'object') {
            const candidates = ['imagen', 'image', 'bytes', 'data', 'base64', 'contenido'];
            for (const k of candidates) {
              if (k in value && value[k]) {
                return toBase64(value[k]);
              }
            }
            if ('data' in value && (Array.isArray(value.data) || typeof value.data === 'string')) {
              return toBase64(value.data);
            }
          }
          return null;
        };
        const guessMime = (imgObj: any, base64Only: string | null) => {
          if (!imgObj) return 'image/png';
          if (imgObj.contentType) return imgObj.contentType;
          if (imgObj.mime) return imgObj.mime;
          if (imgObj.type) return imgObj.type;
          if (base64Only && base64Only.startsWith('/9j/')) return 'image/jpeg';
          return 'image/png';
        };
        imagenes.forEach((img: any) => {
          const base64Only = toBase64(img.imagen ?? img.image ?? img.base64 ?? img.data ?? img.bytes ?? img);
          if (!base64Only) {
            console.warn('Imagen ignorada (no convertible):', img);
            return;
          }
          const mime = guessMime(img, base64Only);
          const full = `data:${mime};base64,${base64Only}`;
          const id = img.id ?? img.imagenId ?? null;
          this.imagenesServer.push({
            id: id ?? undefined,
            base64: full
          });
          this.imagenesPreview.push(full);
        });
        if (!this.imagenesPreview.includes('/assets/Group%20633475.png')) {
          this.imagenesPreview.push('/assets/Group%20633475.png');
        }
        this.imagenesOriginales = JSON.parse(JSON.stringify(this.imagenesServer));
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al traer las imágenes:', err);
        this.imagenesPreview = ['/assets/Group%20633475.png'];
        this.cdr.detectChanges();
      }
    });
  }
  registrarEvento(): void {
    if (this.crearForm.invalid) {
      console.warn('Formulario inválido:', this.crearForm.value);
      this.crearForm.markAllAsTouched();
      return;
    }
    if (!this.proveedor || !this.proveedor.id) {
      console.error('Proveedor no cargado o sin ID:', this.proveedor);
      alert('Proveedor no cargado. Intenta nuevamente.');
      return;
    }
    const formData = this.crearForm.value;
      const nuevoEvento: Evento = {
        titulo: this.crearForm.value.Nombre,
        descripcion: this.crearForm.value.Descripcion,
        proveedor: { id: this.proveedor.id } as Proveedor,
        tipoevento: { id: Number(this.crearForm.value.TipoEvento) } as TipoEvento,
        fechainicio: this.addOneDay(this.crearForm.value.FechaInicio),
        fechafin: this.addOneDay(this.crearForm.value.FechaFin),
        presupuesto: this.crearForm.value.Presupuesto,
        estado: 'Disponible',
        valoracion: 0,
        aforo: this.crearForm.value.Aforo,
        distrito: { id: Number(this.crearForm.value.Distrito) } as Distrito,
      };
    this.eventoService.registrar(nuevoEvento).subscribe({
      next: (res: any) => {
        console.log('Respuesta del backend al registrar evento:', res);
        if (res && res.id) {
          this.registrarImagenEvento(res.id);
        } else {
        }
        try {
          const idProveedorParaNavegar = this.proveedor?.id;
          if (idProveedorParaNavegar) {
            console.log('Navegando a menu-proveedor con id:', idProveedorParaNavegar);
            this.router.navigate(['/menu-proveedor', idProveedorParaNavegar]);
          } else {
            console.warn('No hay id de proveedor para navegar');
          }
        } catch (e) {
          console.error('Error al navegar:', e);
        }
        alert('Evento registrado correctamente!');
        this.crearForm.reset();
        this.resetCalendarRange();
        this.previewUrl = null;
        this.selectedFileBase64 = null;
      },
      error: (err) => {
        console.error('Error HTTP al registrar evento:', err);
        alert('Ocurrió un error al registrar el evento.');
      }
    });
  }
  actualizarEvento(): void {
    if (this.crearForm.invalid) {
      this.crearForm.markAllAsTouched();
      return;
    }

    if (!this.evento || !this.evento.id) {
      console.error('Error: No hay ID de evento para actualizar');
      return;
    }

    const eventoActualizado: Evento = {
      ...this.evento,
      titulo: this.crearForm.value.Nombre,
      descripcion: this.crearForm.value.Descripcion,
      presupuesto: this.crearForm.value.Presupuesto,
      aforo: this.crearForm.value.Aforo,
      fechainicio: this.addOneDay(this.crearForm.value.FechaInicio),
      fechafin: this.addOneDay(this.crearForm.value.FechaFin),
      proveedor: this.evento.proveedor ? this.evento.proveedor : ({ id: this.proveedor.id } as Proveedor),
      tipoevento: { id: Number(this.crearForm.value.TipoEvento) } as TipoEvento,
      distrito: { id: Number(this.crearForm.value.Distrito) } as Distrito,
    };

    console.log('Actualizando datos de texto del evento...');

    this.eventoService.modificar(eventoActualizado).subscribe({
      next: () => {
        console.log('Texto actualizado. Iniciando procesamiento de imágenes...');
        this.procesarImagenesYSalir(eventoActualizado.id!);
      },
      error: (err) => {
        console.error('Error actualizando datos del evento:', err);
        alert('Error al actualizar la información del evento.');
      }
    });
  }
  procesarImagenesYSalir(idEvento: number) {
    const tareasImagenes: Observable<any>[] = [];
    this.imagenesAEliminar.forEach(id => {
      console.log(`Cola de eliminación: Imagen ID ${id}`);
      tareasImagenes.push(this.imagenEventoService.delete(id));
    });
    const nuevasImagenes = this.imagenesPreview.filter(
      img => !img.includes('Group%20633475.png') && !this.imagenesOriginales.some(o => o.base64 === img)
    );
    nuevasImagenes.forEach((base64) => {
      console.log(`Cola de inserción: Nueva imagen detectada`);
      const nueva: ImagenEvento = {
        imagen: base64.split(',')[1],
        evento: { id: idEvento } as Evento
      };
      tareasImagenes.push(this.imagenEventoService.insert(nueva));
    });
    if (tareasImagenes.length > 0) {
      forkJoin(tareasImagenes).subscribe({
        next: (res) => {
          console.log('Todas las imágenes se procesaron correctamente', res);
          alert('Evento actualizado correctamente!');
          this.router.navigate(['/menu-proveedor', this.proveedor.id]);
        },
        error: (err) => {
          console.error('Error al procesar algunas imágenes:', err);
          alert('El evento se actualizó, pero hubo problemas con algunas imágenes.');
          this.router.navigate(['/menu-proveedor', this.proveedor.id]);
        }
      });
    } else {
      console.log('No hubo cambios en imágenes.');
      alert('Evento actualizado correctamente!');
      this.router.navigate(['/menu-proveedor', this.proveedor.id]);
    }
  }
  filtrarDistritos() {
    const ciudadValue = this.crearForm.get('Ciudad')?.value;
    const ciudadId = ciudadValue !== null && ciudadValue !== '' ? Number(ciudadValue) : null;
    if (!ciudadId) {
      this.distritosFiltrados = [];
      this.crearForm.get('Distrito')?.setValue('');
      this.crearForm.get('Distrito')?.disable();
      return;
    }
    this.distritosFiltrados = this.distrito.filter(d => d.ciudad.id === ciudadId);
    const distritoActualId = this.evento?.distrito?.id ?? null;
    if (distritoActualId && this.distritosFiltrados.some(d => d.id === distritoActualId)) {
      this.crearForm.patchValue({ Distrito: distritoActualId });
    } else {
      this.crearForm.patchValue({ Distrito: '' });
    }
    if (this.distritosFiltrados.length > 0) {
      this.crearForm.get('Distrito')?.enable();
    } else {
      this.crearForm.get('Distrito')?.disable();
    }
    this.cdr.detectChanges();
  }
  registrarImagenEvento(idEvento: number): void {
    const imagenesReales = this.imagenesPreview.filter(
      img => img !== '/assets/Group%20633475.png'
    );
    if (imagenesReales.length === 0) {
      console.warn('No hay imágenes reales para registrar.');
      return;
    }
    console.log(`Registrando ${imagenesReales.length} imágenes para evento ID ${idEvento}`);
    imagenesReales.forEach((base64, index) => {
      const imagenEvento: ImagenEvento = {
        imagen: base64.split(',')[1],
        evento: { id: idEvento } as Evento
      };
      this.imagenEventoService.insert(imagenEvento).subscribe({
        next: () => console.log(`Imagen ${index + 1} registrada correctamente`),
        error: (err) => console.error(`Error al registrar imagen ${index + 1}:`, err)
      });
    });
  }
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      if (this.currentUploadIndex != null && this.currentUploadIndex >= 0 && this.currentUploadIndex < this.imagenesPreview.length) {
        this.imagenesPreview[this.currentUploadIndex] = base64String;
      } else {
        this.imagenesPreview.unshift(base64String);
      }
      if (!this.imagenesPreview.includes('/assets/Group%20633475.png')) {
        this.imagenesPreview.push('/assets/Group%20633475.png');
      }
      this.cdr.detectChanges();
      input.value = '';
      this.currentUploadIndex = null;
    };
    reader.readAsDataURL(file);
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
    this.loginService.logout();
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
    if (this.animando) return;
    if (this.mostrarCerrarSesion) return;
    const target = event.target as HTMLElement;
    const menu = document.querySelector('.menu-hamburguesa-text');
    const boton = document.querySelector('.menu-hamburguesa-boton');
    if (this.menuActivo && menu && boton) {
      const clickEnMenu = menu.contains(target);
      const clickEnBoton = boton.contains(target);
      if (!clickEnMenu && !clickEnBoton) {
        this.cerrarMenu(menu, boton);
      }
    }
    const menuPerfil = document.querySelector('.encabezado-perfil-menu');
    const containerPerfil = document.querySelector('.encabezado-perfil-container');

    if (this.menuPerfilActivo && menuPerfil && containerPerfil) {
      const clickEnMenuP = menuPerfil.contains(target);
      const clickEnBotonP = containerPerfil.contains(target);

      if (!clickEnMenuP && !clickEnBotonP) {
        this.cerrarMenuPerfil(menuPerfil);
      }
    }
  }
  onDateSelected(event: { start: Date, end?: Date }) {
    console.log('Fecha seleccionada:', event.start, event.end);
    this.crearForm.patchValue({
      FechaInicio: event.start,
      FechaFin: event.end ?? event.start
    });
    this.crearForm.updateValueAndValidity();
    this.cdr.detectChanges();
  }
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  triggerFileInput(index?: number): void {
    this.currentUploadIndex = index ?? null;
    this.fileInput.nativeElement.click();
  }
  Desactivado(): boolean {
    console.log('Estado del formulario:', this.crearForm.status, this.crearForm.value);
    return this.crearForm.invalid;
  }
  onImageClick(img: string, index: number, event: MouseEvent): void {
    event.stopPropagation();
    const esSlotVacio = img === '/assets/Group%20633475.png';
    if (esSlotVacio) {
      this.triggerFileInput(index);
      return;
    }
    const serverIndex = this.imagenesServer.findIndex(s => s.base64 === img);
    if (serverIndex !== -1) {
      const imagenIdToDelete = this.imagenesServer[serverIndex].id;
      if (imagenIdToDelete) {
        this.imagenesAEliminar.push(imagenIdToDelete);
      }
      this.imagenesServer.splice(serverIndex, 1);
    }
    this.imagenesPreview.splice(index, 1);
    if (!this.imagenesPreview.includes('/assets/Group%20633475.png')) {
      this.imagenesPreview.push('/assets/Group%20633475.png');
    }
    this.cdr.detectChanges();
  }
  resetCalendarRange() {
    this.crearForm.patchValue({ FechaInicio: null, FechaFin: null });
    this.initialStart = null;
    this.initialEnd = null;
    this.cdr.detectChanges();
  }
  private normalize(date: Date | null): Date | null {
    if (!date) return null;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
  private addOneDay(date: Date): Date{
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + 1);
    return newDate;
  }
}
