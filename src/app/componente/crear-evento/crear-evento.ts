import {ChangeDetectorRef, Component, ElementRef, HostListener, inject, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
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
import {firstValueFrom} from 'rxjs';

@Component({
  selector: 'app-crear-evento',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    CalendarComponent,
  ],
  templateUrl: './crear-evento.html',
  styleUrl: './crear-evento.css',
})
export class CrearEvento {
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
    this.imagenesPreview = ['/assets/Group%20633475.png'];
    const idProveedor = Number(this.route.snapshot.params['idProveedor']);
    const idEvento = Number(this.route.snapshot.params['idEvento']);
    console.log('🟩 ID de proveedor detectado:', idProveedor);
    if (idEvento) {
      this.eventoService.listarPorId(idEvento).subscribe(evento => {
        this.cargarImagenesEvento(idEvento);
        // Aquí SÍ cargas las fechas del backend
        this.fechaInicio = evento.fechainicio ? new Date(evento.fechainicio) : null;
        this.fechaFin = evento.fechafin ? new Date(evento.fechafin) : null;

        // IMPORTANTE: normalize antes de pasarlas al calendario
        this.fechaInicio = this.normalize(this.fechaInicio);
        this.fechaFin = this.normalize(this.fechaFin);
      });
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

    Promise.all([
      firstValueFrom(this.ciudadService.listar()),
      firstValueFrom(this.distritoService.listar()),
      firstValueFrom(this.tipoEventoService.listar())
    ])
      .then(([ciudades, distritos, tiposEvento]) => {
        this.ciudad = ciudades ?? [];
        this.distrito = distritos ?? [];
        this.tipoEvento = tiposEvento ?? [];
        if (idEvento) {
          this.cargarEvento(idEvento);
        }
      })
      .catch(err => {
        console.error("Error cargando datos:", err);
      });
  }
  cargarEvento(idEvento: number) {
    this.eventoService.listarPorId(idEvento).subscribe(data => {
      this.evento = data;
      const inicio = data.fechainicio ? new Date(data.fechainicio) : null;
      const fin = data.fechafin ? new Date(data.fechafin) : null;

      this.crearForm.patchValue({
        Nombre: data.titulo,
        Descripcion: data.descripcion,
        FechaInicio: inicio,
        FechaFin: fin,
        Presupuesto: data.presupuesto,
        Aforo: data.aforo,
        TipoEvento: data.tipoevento?.id,
        Ciudad: data.distrito?.ciudad?.id,
        Distrito: data.distrito?.id
      });
      this.filtrarDistritos();
      // Llamar al calendario solo para mostrar selección, no para disparar guardado.
      if (inicio) {
        // onDateSelected actualiza el formulario y llama cdr.detectChanges()
        this.onDateSelected({ start: inicio, end: fin ?? inicio });
        this.initialStart = inicio;
        this.initialEnd = fin ?? inicio;
        this.cdr.detectChanges();
      }

      this.cargarImagenesEvento(idEvento);
    });
    this.cdr.detectChanges();
  }
  cargarImagenesEvento(idEvento: number) {
    this.imagenEventoService.listarPorIdEvento(idEvento).subscribe(imagenes => {
      this.imagenesServer = [];
      this.imagenesPreview = [];

      if (imagenes && imagenes.length > 0) {
        this.imagenesServer = imagenes.map(img => ({
          id: img.id,
          base64: `data:image/png;base64,${img.imagen}`
        }));

        this.imagenesPreview = [...this.imagenesServer.map(i => i.base64)];
        this.imagenesOriginales = JSON.parse(JSON.stringify(this.imagenesServer)); // clone
      } else {
        this.imagenesPreview = ['/assets/Group%20633475.png'];
      }

      // asegurar placeholder
      if (!this.imagenesPreview.includes('/assets/Group%20633475.png')) {
        this.imagenesPreview.push('/assets/Group%20633475.png');
      }

      this.cdr.detectChanges();
    });
  }
  registrarEvento(): void {
    console.log('🟦 [1] Iniciando registro de evento...');
    console.log('▶️ (ngSubmit) registrarEvento() llamado - estado form:', this.crearForm.status);
    if (this.crearForm.invalid) {
      console.warn('⚠️ [2] Formulario inválido:', this.crearForm.value);
      this.crearForm.markAllAsTouched();
      return;
    }

    if (!this.proveedor || !this.proveedor.id) {
      console.error('❌ [3] Proveedor no cargado o sin ID:', this.proveedor);
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
        console.log('✅ [5] Respuesta del backend al registrar evento:', res);
        if (res && res.id) {
          this.registrarImagenEvento(res.id);
        } else {
        }
        try {
          const idProveedorParaNavegar = this.proveedor?.id;
          if (idProveedorParaNavegar) {
            console.log('🔀 Navegando a menu-proveedor con id:', idProveedorParaNavegar);
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
        console.error('❌ [12] Error HTTP al registrar evento:', err);
        alert('Ocurrió un error al registrar el evento.');
      }
    });
  }
  actualizarEvento(): void {
    if (this.crearForm.invalid) {
      this.crearForm.markAllAsTouched();
      return;
    }

    const eventoActualizado: Evento = {
      id: this.evento.id,
      titulo: this.crearForm.value.Nombre,
      descripcion: this.crearForm.value.Descripcion,
      proveedor: { id: this.proveedor.id } as Proveedor,
      tipoevento: { id: Number(this.crearForm.value.TipoEvento) } as TipoEvento,
      fechainicio: this.addOneDay(this.crearForm.value.FechaInicio),
      fechafin: this.addOneDay(this.crearForm.value.FechaFin),
      presupuesto: this.crearForm.value.Presupuesto,
      estado: this.evento.estado,
      valoracion: this.evento.valoracion,
      aforo: this.crearForm.value.Aforo,
      distrito: { id: Number(this.crearForm.value.Distrito) } as Distrito,
    };

    this.eventoService.modificar(eventoActualizado).subscribe({
      next: () => {
        console.log('✅ Evento actualizado. Sincronizando imágenes...');

        // 1️⃣ Eliminar las que se marcaron
        this.imagenesAEliminar.forEach(id => {
          this.imagenEventoService.delete(id).subscribe({
            next: () => console.log(`🗑️ Imagen ${id} eliminada del servidor`),
            error: err => console.error('Error eliminando imagen', err)
          });
        });
        this.imagenesAEliminar = [];
        // 2️⃣ Detectar imágenes nuevas o reemplazadas
        const nuevasImagenes = this.imagenesPreview.filter(
          img => !img.includes('Group%20633475.png') && !this.imagenesOriginales.some(o => o.base64 === img)
        );

        nuevasImagenes.forEach((base64, index) => {
          const nueva: ImagenEvento = {
            imagen: base64.split(',')[1],
            evento: { id: eventoActualizado.id } as Evento
          };
          this.imagenEventoService.insert(nueva).subscribe({
            next: () => console.log(`🆕 Imagen nueva ${index + 1} registrada`),
            error: (err) => console.error(`❌ Error registrando nueva imagen:`, err)
          });
        });

        // 3️⃣ Mostrar confirmación
        alert('Evento actualizado correctamente!');
        this.router.navigate(['/menu-proveedor', this.proveedor.id]);
      },
      error: (err) => {
        console.error('Error al actualizar evento:', err);
        alert('Error actualizando evento.');
      }
    });
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

    // Filtramos los distritos ya cargados (this.distrito contiene todos)
    this.distritosFiltrados = this.distrito.filter(d => d.ciudad.id === ciudadId);

    // Si el evento existe y su distrito pertenece a esta ciudad, restauramos su id
    const distritoActualId = this.evento?.distrito?.id ?? null;
    if (distritoActualId && this.distritosFiltrados.some(d => d.id === distritoActualId)) {
      this.crearForm.patchValue({ Distrito: distritoActualId });
    } else {
      // Si no hay distrito anterior válido para esta ciudad, lo dejamos vacío
      this.crearForm.patchValue({ Distrito: '' });
    }

    // Habilitamos/deshabilitamos el select según corresponda
    if (this.distritosFiltrados.length > 0) {
      this.crearForm.get('Distrito')?.enable();
    } else {
      this.crearForm.get('Distrito')?.disable();
    }

    // Forzar detección en caso de timing async
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
    console.log(`🖼️ Registrando ${imagenesReales.length} imágenes para evento ID ${idEvento}`);
    imagenesReales.forEach((base64, index) => {
      const imagenEvento: ImagenEvento = {
        imagen: base64.split(',')[1],
        evento: { id: idEvento } as Evento
      };
      this.imagenEventoService.insert(imagenEvento).subscribe({
        next: () => console.log(`✅ Imagen ${index + 1} registrada correctamente`),
        error: (err) => console.error(`❌ Error al registrar imagen ${index + 1}:`, err)
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
        // reemplaza slot especifico
        this.imagenesPreview[this.currentUploadIndex] = base64String;
      } else {
        // si no vienen previews, inserta al inicio
        this.imagenesPreview.unshift(base64String);
      }

      // asegurar slot vacío
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
    console.log('🧠 Estado del formulario:', this.crearForm.status, this.crearForm.value);
    return this.crearForm.invalid;
  }
  onImageClick(img: string, index: number, event: MouseEvent): void {
    event.stopPropagation();
    const esSlotVacio = img === '/assets/Group%20633475.png';
    if (esSlotVacio) {
      this.triggerFileInput(index);
      return;
    }

    // Si la imagen corresponde a una imagen del servidor, eliminarla del arreglo server
    const serverIndex = this.imagenesServer.findIndex(s => s.base64 === img);
    if (serverIndex !== -1) {
      const imagenIdToDelete = this.imagenesServer[serverIndex].id;
      if (imagenIdToDelete) {
        this.imagenesAEliminar.push(imagenIdToDelete);
      }
      this.imagenesServer.splice(serverIndex, 1);
    }

    // remover de preview
    this.imagenesPreview.splice(index, 1);

    // asegurar que hay un slot vacío al final
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
  //Soluciona un bug de que se registra un dia antes.
  private addOneDay(date: Date): Date{
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + 1);
    return newDate;
  }
}
