import {Component, ElementRef, inject} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {NgOptimizedImage} from '@angular/common';
import { EspecializacionServices } from '../../services/especializacion-services';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import {Proveedor} from '../../model/proveedor';
import {ProveedorServices} from '../../services/proveedor-services';
import {Especializacion} from '../../model/especializacion';

@Component({
  selector: 'app-register-proveedor',
  imports: [
    RouterLink,
    NgOptimizedImage,
    ReactiveFormsModule
  ],
  templateUrl: './register-proveedor.html',
  styleUrl: './register-proveedor.css',
})
export class RegisterProveedor {
  registroForm: FormGroup;
  private lastErrorCount = 0;
  private headerOffset = 80;
  previewUrl: string | ArrayBuffer | null = null;
  fotoBase64: string = '';
  route : Router = inject(Router);
  proveedor: Proveedor[] = [];
  especializacion: Especializacion[] = [];
  proveedorService: ProveedorServices = inject(ProveedorServices);
  especializacionService: EspecializacionServices = inject(EspecializacionServices);
  private fb: FormBuilder = inject(FormBuilder);
  constructor(private el: ElementRef, fb: FormBuilder) {
    this.registroForm = fb.group({
      Ruc: ['', [Validators.required, Validators.minLength(11), Validators.maxLength(11)]],
      Organizacion: ['', [Validators.required, Validators.minLength(2)]],
      Email: ['', [Validators.required, Validators.email]],
      Celular: ['', [Validators.required, Validators.minLength(9), Validators.maxLength(9)]],
      Contrasena: ['', [Validators.required, Validators.minLength(6)]],
      Contrasena2: ['', Validators.required],
      Direccion: ['', Validators.required],
      Especializacion: ['', Validators.required],
    }, {
      validators: this.passwordMatchValidator
    });
  }
  ngOnInit() {
    this.especializacionService.listar().subscribe({
      next: (data) => this.especializacion = data,
      error: (err) => console.error('Error al cargar especializaciones:', err)
    });
  }
  continuarRegistro() {
    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      return;
    }
    const form = this.registroForm.value;
    this.route.navigate(['/register-captcha'], {
      queryParams: {
        tipo: 'PROVEEDOR',
        especializacion: this.especializacion.find(e => e.id === Number(this.registroForm.value.Especializacion)),
        email: form.Email,
        ruc: form.Ruc,
        numerocontacto: form.Celular,
        nombreorganizacion: form.Organizacion,
        contrasena: form.Contrasena,
        direccion: form.Direccion,
        foto: this.fotoBase64 || '',
        ganancia: 0,
        valoracion: 0,
        estado: true,
        role: {id: 2, name: 'ROLE_PROVEEDOR'},
      }
    });
  }
  triggerFileInput() {
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    fileInput.click();
  }
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
        this.fotoBase64 = e.target.result.split(',')[1];
      };
      reader.readAsDataURL(file);
    }
  }
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const contrasena = control.get('Contrasena');
    const contrasena2 = control.get('Contrasena2');
    if (!contrasena || !contrasena2) {
      return null;
    }
    if (contrasena.value === contrasena2.value) {
      return null;
    } else {
      return { passwordMismatch: true };
    }
  }
  get contrasena2Error(): string {
    const contrasena2Control = this.registroForm.get('Contrasena2');
    if (contrasena2Control?.errors?.['required'] && contrasena2Control.touched) {
      return 'La confirmación de contraseña es requerida';
    }
    if (this.registroForm.errors?.['passwordMismatch'] && contrasena2Control?.touched) {
      return 'Las contraseñas no coinciden';
    }
    return '';
  }
  get emailError(): string {
    const emailControl = this.registroForm.get('Email');
    if (emailControl?.errors?.['required'] && emailControl.touched) {
      return 'El email es requerido';
    }
    if (emailControl?.errors?.['email'] && emailControl.touched) {
      return 'El formato del email no es válido';
    }
    return '';
  }
  get organizacionError(): string {
    const organizacionControl = this.registroForm.get('Organizacion');
    if (organizacionControl?.errors?.['required'] && organizacionControl.touched) {
      return 'El nombre de la organización es requerido';
    }
    if (organizacionControl?.errors?.['minlength'] && organizacionControl.touched) {
      return 'El nombre de la organización debe tener al menos 2 caracteres';
    }
    return '';
  }
  get direccionError(): string {
    const organizacionControl = this.registroForm.get('Direccion');
    if (organizacionControl?.errors?.['required'] && organizacionControl.touched) {
      return 'El nombre de la dirección es requerido';
    }
    return '';
  }
  get rucError(): string {
    const rucControl = this.registroForm.get('Ruc');
    if (!rucControl) return '';

    if (rucControl.errors?.['required'] && rucControl.touched) {
      return 'El RUC es requerido';
    }
    if (rucControl.errors?.['pattern'] && rucControl.touched) {
      return 'El RUC solo debe contener números';
    }
    if ((rucControl.errors?.['minlength'] || rucControl.errors?.['maxlength']) && rucControl.touched) {
      return 'El RUC debe tener 11 dígitos';
    }
    return '';
  }
  get contrasenaError(): string {
    const contrasenaControl = this.registroForm.get('Contrasena');
    if (contrasenaControl?.errors?.['required'] && contrasenaControl.touched) {
      return 'La contraseña es requerida';
    }
    if (contrasenaControl?.errors?.['minlength'] && contrasenaControl.touched) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    return '';
  }
  get celularError(): string {
    const celularControl = this.registroForm.get('Celular');
    if (!celularControl) return '';

    if (celularControl.errors?.['required'] && celularControl.touched) {
      return 'El celular es requerido';
    }
    if (celularControl.errors?.['pattern'] && celularControl.touched) {
      return 'El celular solo debe contener números';
    }
    if (celularControl.errors?.['minlength'] && celularControl.touched) {
      return 'El celular debe tener al menos 9 dígitos';
    }
    return '';
  }
  ngAfterViewChecked() {
    const errorMessages = this.el.nativeElement.querySelectorAll('.error-message');
    const currentErrorCount = errorMessages.length;
    if (currentErrorCount > this.lastErrorCount && currentErrorCount > 0) {
      const lastError = errorMessages[errorMessages.length - 1] as HTMLElement;
      if (lastError) {
        const scrollContainer = this.el.nativeElement.closest('main')
          || document.scrollingElement
          || document.documentElement;
        const rect = lastError.getBoundingClientRect();
        const absoluteY = window.scrollY + rect.top;
        scrollContainer.scrollTo({
          top: absoluteY - 100,
          behavior: 'smooth'
        });
      }
    }
    this.lastErrorCount = currentErrorCount;
  }
}
