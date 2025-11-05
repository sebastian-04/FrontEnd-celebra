import {ChangeDetectorRef, Component, HostListener, inject} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import {NgOptimizedImage} from '@angular/common';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-ver-mi-perfil',
  imports: [
    ReactiveFormsModule,
    NgOptimizedImage,
    RouterLink

  ],
  templateUrl: './ver-mi-perfil.html',
  styleUrl: './ver-mi-perfil.css',
})

export class VerMiPerfil {
  buscarForm: FormGroup;
  buscarAvanzadaForm: FormGroup;
  /*MODAL PARA ELIMINAR CUENTA */ mostrarEliminarCuenta = false;
  /*CON ESTO MUESTRO LA IMAGEN */ mostrarImagenModal = false;
  /*CON ESTE SE VE LA CONTRA*/ passwordVisible = false;
  /*MODO EDICION*/ modoEdicion = false;
  /*PARA EL FORM GROUP*/perfilForm: FormGroup; // <-- AÑADE ESTA LÍNEA
  selectedImagePreview: string | ArrayBuffer | null = null;
  mostrarFiltrosAvanzados = false;
  menuPerfilActivo = false;
  menuActivo = false;
  animando = false;
  mostrarCerrarSesion = false;
  private fb: FormBuilder = inject(FormBuilder);

  private currentUserData = {
    nombres: 'Sasaki Gushiken Flores',
    dni: '74389261',
    email: 'gushiken.sasaki@gmail.com',
    telefono: '+81 80 4567 2391',
    descripcion: 'Soy Sasaki Gushiken Flores, especialista en la planificación...'
  };

  constructor(private cdr: ChangeDetectorRef) {
    this.perfilForm = this.fb.group({
      // Basado en tu imagen de validaciones y tus campos
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      dni: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]],

      email: ['', [Validators.required, Validators.email]],

      // Para Teléfono: Exactamente 9 dígitos numéricos
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
      contrasena: [''], // Opcional, solo si quiere cambiarla
      confirmarContrasena: [''], // <-- 2. AÑADE EL NUEVO CAMPO
      descripcion: [''] // Sin validación por ahora
    },{

      validators: customPasswordValidator // <-- 3. APLICA EL VALIDADOR AL GRUPO

    });

    this.resetFormToOriginalData();

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




/* Funcionalidades del ver perfil */
  abrirModalEliminarCuenta() {
    this.mostrarEliminarCuenta = true;
    document.body.classList.add('modal-abierto');
  }

  cerrarModalEliminar() {
    this.mostrarEliminarCuenta = false;
    document.body.classList.remove('modal-abierto');
  }

  confirmarEliminarCuenta(event: MouseEvent) {
    event.stopPropagation();
    console.log('La cuenta ha sido eliminada'); // Aquí pones tu lógica para eliminar
    this.cerrarModalEliminar();
  }
  abrirModalImagen() {
    this.mostrarImagenModal = true;
    document.body.classList.add('modal-abierto');
  }

  cerrarModalImagen() {
    this.mostrarImagenModal = false;
    document.body.classList.remove('modal-abierto');
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }



  activarModoEdicion() {
    this.modoEdicion = true;
    this.selectedImagePreview = null;
    // ¡El formulario ya tiene los datos correctos!
  }

  // 2. Guarda los cambios y sale del modo de edición
  guardarCambios() {
    // ... (Aquí iría tu lógica para enviar al backend)
    console.log("Cambios guardados:", this.perfilForm.value);

    // (Importante) Actualiza los "datos originales" con los nuevos datos guardados
    this.currentUserData = {
      ...this.currentUserData, // Mantiene datos que no estén en el form
      ...this.perfilForm.value, // Sobrescribe con los nuevos valores
    };

    this.modoEdicion = false;
  }

  // 3. Cancela la edición y sale
  cancelarEdicion() {
    this.modoEdicion = false;
    this.selectedImagePreview = null;

    // Llama a la función de reseteo para volver a los datos originales
    this.resetFormToOriginalData();
  }

  // 4. Se activa cuando el usuario elige una foto nueva
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.selectedImagePreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }


  /* Para el guradado de datos en el form de edicion*/
  private resetFormToOriginalData() {
    this.perfilForm.reset({
      // ... (nombres, dni, email, telefono)
      contrasena: '',
      confirmarContrasena: '', // <-- AÑADE ESTA LÍNEA
      descripcion: this.currentUserData.descripcion
    });
  }





}
/*Validadro para la contrseña*/
export const customPasswordValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {

  // Obtenemos los dos campos que queremos comparar
  const password = control.get('contrasena');
  const confirmPassword = control.get('confirmarContrasena');

  // Si los campos no existen, no hagas nada
  if (!password || !confirmPassword) {
    return null;
  }

  // Limpia errores antiguos del campo "confirmar"
  if (confirmPassword.errors && !confirmPassword.errors['mustMatch']) {
    // No borres otros errores, solo el nuestro
  } else {
    confirmPassword.setErrors(null);
  }

  // --- LÓGICA PRINCIPAL ---

  // 1. Si el campo "contrasena" está vacío, todo es válido.
  // El usuario no está intentando cambiarla.
  if (!password.value) {
    return null;
  }

  // 2. Si llegamos aquí, el usuario SÍ está escribiendo una contraseña.
  // Ahora revisamos la longitud de la PRIMERA contraseña.
  if (password.value.length < 6) {
    // Ponemos el error en el primer campo
    password.setErrors({ minlength: true });
    return { minlength: true }; // Error para el grupo
  }

  // 3. Si la longitud es correcta, revisamos que la SEGUNDA coincida.
  if (password.value !== confirmPassword.value) {
    // Ponemos el error en el segundo campo
    confirmPassword.setErrors({ mustMatch: true });
    return { mustMatch: true }; // Error para el grupo
  }

  // Si todo está bien
  return null;
};
