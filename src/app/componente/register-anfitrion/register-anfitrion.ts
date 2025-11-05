import {Component, ElementRef, inject} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {NgOptimizedImage} from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import {Anfitrion} from '../../model/anfitrion';
import {AnfitrionServices} from '../../services/anfitrion-services';
@Component({
  selector: 'app-register-anfitrion',
  imports: [
    RouterLink,
    NgOptimizedImage,
    ReactiveFormsModule
  ],
  templateUrl: './register-anfitrion.html',
  styleUrl: './register-anfitrion.css',
})
export class RegisterAnfitrion {
  registroForm: FormGroup;
  private lastErrorCount = 0;
  private headerOffset = 80;
  previewUrl: string | ArrayBuffer | null = null;
  fotoBase64: string = '';
  private fb: FormBuilder = inject(FormBuilder);
  anfitrion: Anfitrion[] = []
  route : Router = inject(Router);
  constructor(private el: ElementRef, fb: FormBuilder) {
    this.registroForm = fb.group({
      Nombre: ['', [Validators.required, Validators.minLength(2)]],
      Email: ['', [Validators.required, Validators.email]],
      Dni: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(8), Validators.pattern('^[0-9]+$')]],
      Celular: ['', [Validators.required, Validators.minLength(9), Validators.maxLength(9), Validators.pattern('^[0-9]+$')]],
      Contrasena: ['', [Validators.required, Validators.minLength(6)]],
      Contrasena2: ['', Validators.required],
      Apellidos: ['', [Validators.required, Validators.minLength(2)]],
    }, {
      validators: this.passwordMatchValidator
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
        tipo: 'ANFITRION',
        nombre: form.Nombre,
        apellido: form.Apellidos,
        dni: form.Dni,
        email: form.Email,
        telefono: form.Celular,
        contrasena: form.Contrasena,
        foto: this.fotoBase64 || '',
        estado: true,
        role: { id: 3, name: 'ROLE_ANFITRION' }
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
  get nombreError(): string {
    const nombreControl = this.registroForm.get('Nombre');
    if (nombreControl?.errors?.['required'] && nombreControl.touched) {
      return 'El nombre es requerido';
    }
    if (nombreControl?.errors?.['minlength'] && nombreControl.touched) {
      return 'El nombre debe tener al menos 2 caracteres';
    }
    return '';
  }
  get apellidoError(): string {
    const nombreControl = this.registroForm.get('Apellidos');
    if (nombreControl?.errors?.['required'] && nombreControl.touched) {
      return 'El apellido es requerido';
    }
    if (nombreControl?.errors?.['minlength'] && nombreControl.touched) {
      return 'El apellido debe tener al menos 2 caracteres';
    }
    return '';
  }
  get dniError(): string {
    const dniControl = this.registroForm.get('Dni');
    if (!dniControl) return '';

    if (dniControl.errors?.['required'] && dniControl.touched) {
      return 'El DNI es requerido';
    }
    if (dniControl.errors?.['pattern'] && dniControl.touched) {
      return 'El DNI solo debe contener números';
    }
    if ((dniControl.errors?.['minlength'] || dniControl.errors?.['maxlength']) && dniControl.touched) {
      return 'El DNI debe tener exactamente 8 dígitos';
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
