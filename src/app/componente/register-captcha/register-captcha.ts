import {AfterViewInit, Component, ElementRef, inject, NgZone, OnInit, ViewChild} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {debounceTime, fromEvent} from 'rxjs';
import {ActivatedRoute, Route, Router, RouterLink} from '@angular/router';
import {jsPDF} from 'jspdf';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {AnfitrionServices} from '../../services/anfitrion-services';
import {Anfitrion} from '../../model/anfitrion';
import {Proveedor} from '../../model/proveedor';
import {ProveedorServices} from '../../services/proveedor-services';

@Component({
  selector: 'app-register-captcha',
  imports: [
    NgOptimizedImage,
    RouterLink,
    ReactiveFormsModule
  ],
  templateUrl: './register-captcha.html',
  styleUrl: './register-captcha.css',
})
export class RegisterCaptcha implements AfterViewInit {
  @ViewChild('textoTerminos') textoTerminos!: ElementRef;
  @ViewChild('parrafoWrapper') parrafoWrapper!: ElementRef;
  scrollPosition = 0;
  barraHeight = 64;
  alturaTexto = 0;
  wrapperHeight = 0;
  datos: any;
  tipoUsuario: string;
  router : Router = inject(Router);
  anfitrionService: AnfitrionServices = inject(AnfitrionServices);
  proveedorService: ProveedorServices = inject(ProveedorServices);
  route : ActivatedRoute = inject(ActivatedRoute)
  form: FormGroup;
  private fb: FormBuilder = inject(FormBuilder);
  private ngZone: NgZone = inject(NgZone);
  constructor() {
    this.form = this.fb.group({
      aceptarTerminos: [false, Validators.requiredTrue],
    });
  }
  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.datos = params;
      this.tipoUsuario = params['tipo'];
    });
  }
  registrar() {
    const tipo = this.datos.tipo;
    const id = this.datos.id;
    if (tipo == 'ANFITRION') {
      const anfitrion: Anfitrion = {
        nombre: this.datos.nombre,
        apellido: this.datos.apellido,
        dni: this.datos.dni,
        email: this.datos.email,
        telefono: this.datos.telefono,
        contrasena: this.datos.contrasena,
        foto: this.datos.foto || '',
        estado: true,
        role: {id: 3, name: 'ROLE_ANFITRION'}
      };
      this.anfitrionService.registrar(anfitrion).subscribe({
        next: (response) => {
          console.log('Registro exitoso. Response del backend:', response);
          alert('Registro exitoso');
          if (response && (response as any).id) {
            console.log('ID del anfitrión creado:',(response as any).id);
            this.router.navigate([`/login`]);
          }
        },
      });
    }
    else{
      const proveedor: Proveedor = {
        especializacion: {
          id: 1,
          nombre: 'Bodas',
        },
        email: this.datos.email,
        ruc: this.datos.ruc,
        numerocontacto: this.datos.numerocontacto,
        nombreorganizacion: this.datos.nombreorganizacion,
        contrasena: this.datos.contrasena,
        direccion: this.datos.direccion,
        foto: this.datos.foto || '',
        ganancia: 0,
        valoracion: 0,
        estado: true,
        role: { id: 2, name: 'ROLE_PROVEEDOR' }
      };
      this.proveedorService.registrar(proveedor).subscribe({
        next: (response) => {
          console.log('Registro exitoso. Response del backend:', response);
          alert('Registro exitoso');
          if (response && (response as any).id) {
            console.log('ID del proveedor creado:',(response as any).id);
            this.router.navigate([`/login`]);
          }
        },
      });
    }
  }
  ngAfterViewInit() {
    setTimeout(() => {
      this.alturaTexto = this.textoTerminos.nativeElement.scrollHeight;
      this.wrapperHeight = this.parrafoWrapper.nativeElement.clientHeight;
      const barra2El = document.querySelector('.barra-2') as HTMLElement;
      if (barra2El) this.barraHeight = barra2El.clientHeight;
      this.ngZone.runOutsideAngular(() => {
        fromEvent<WheelEvent>(this.parrafoWrapper.nativeElement, 'wheel')
          .pipe(debounceTime(5))
          .subscribe((ev) => {
            ev.preventDefault();
            this.ngZone.run(() => this.onWheel(ev));
          });
      });
    }, 0);
  }
  actualizarTexto() {
    const contenedor = this.textoTerminos.nativeElement.parentElement as HTMLElement;
    const contenedorAltura = contenedor.clientHeight; // altura visible
    const barra1 = document.querySelector('.barra-1') as HTMLElement;
    const alturaBarra1 = barra1.clientHeight;
    const espacioBarra = Math.max(0, alturaBarra1 - this.barraHeight);
    const porcentaje = this.scrollPosition / espacioBarra;
    const maxScroll = this.alturaTexto - contenedorAltura + 40;
    const desplazamiento = -(porcentaje * maxScroll);
    this.textoTerminos.nativeElement.style.transform = `translateY(${desplazamiento}px)`;
  }
  onBarraMouseDown(event: MouseEvent) {
    event.preventDefault();
    const barra1 = this.parrafoWrapper.nativeElement.querySelector('.barra-1') as HTMLElement;
    if (!barra1) return;
    const rect = barra1.getBoundingClientRect();
    const espacioBarra = Math.max(0, rect.height - this.barraHeight);
    const startY = event.clientY;
    const startScrollPos = this.scrollPosition;
    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      let nuevaPos = startScrollPos + deltaY;
      nuevaPos = Math.min(espacioBarra, Math.max(0, nuevaPos));
      this.scrollPosition = nuevaPos;
      this.actualizarTexto();
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }
  onWheel(ev: WheelEvent) {
    const barra1 = this.parrafoWrapper.nativeElement.querySelector('.barra-1') as HTMLElement;
    if (!barra1) return;
    const alturaBarra1 = barra1.clientHeight;
    const espacioBarra = Math.max(0, alturaBarra1 - this.barraHeight);
    const maxScroll = Math.max(0, this.alturaTexto - this.wrapperHeight);
    if (maxScroll <= 0) return; // nada que desplazar
    const factorSensibilidad = 1;
    const deltaPos = (ev.deltaY * espacioBarra * factorSensibilidad) / maxScroll;
    let nuevaPos = this.scrollPosition + deltaPos;
    nuevaPos = Math.min(espacioBarra, Math.max(0, nuevaPos));
    this.scrollPosition = nuevaPos;
    this.actualizarTexto();
  }
  descargarPDF() {
    const doc = new jsPDF();
    const contenido = `
      Al acceder o utilizar nuestros servicios, usted acepta cumplir con los presentes Términos y Condiciones. Si no está de acuerdo con ellos, le recomendamos no utilizar nuestros servicios.
      1. Objeto del servicio
      Celebra pone a disposición de los usuarios una plataforma en línea destinada a la gestión de eventos, la contratación de proveedores.
      2. Registro y cuenta de usuario
      Para acceder a ciertas funciones, el usuario deberá crear una cuenta proporcionando información veraz y actualizada. El usuario es responsable de mantener la confidencialidad de sus credenciales y de toda actividad realizada con su cuenta.
      3. Uso adecuado de los servicios
      El usuario se compromete a utilizar la plataforma únicamente para fines lícitos y a no realizar actividades que puedan dañar, sobrecargar o afectar el funcionamiento del servicio. Está prohibido el uso con fines fraudulentos, de suplantación de identidad o de distribución de contenido ilegal.
      4. Responsabilidad de los Proveedores
      La información proporcionada por los proveedores (incluyendo, pero no limitado a, descripciones de servicios, precios y disponibilidad) es su responsabilidad exclusiva. Celebra no garantiza la exactitud de dicha información.
      5. Proceso de Reserva y Pagos
      Los pagos se realizan directamente al proveedor, a menos que se especifique lo contrario en el acuerdo entre las partes. Celebra no se hace responsable de las transacciones de pago.
      6. Limitación de Responsabilidad, Ley Aplicable y Jurisdicción
      Celebra no será responsable por daños indirectos, incidentales, especiales o consecuentes que resulten del uso o la incapacidad de usar la plataforma. En la máxima medida permitida por la ley, nuestra responsabilidad total por cualquier reclamo relacionado con el uso de la plataforma se limita a la cantidad de dinero que usted haya pagado, en su caso, por los servicios. Los presentes Términos y Condiciones se rigen por las leyes de la República del Perú.
    `;
    doc.text(contenido, 10, 10);
    doc.save('terminos_y_condiciones_celebra.pdf');
  }
  isAceptarTerminosInvalid(): boolean {
    const control = this.form.get('aceptarTerminos');
    if (control) {
      return control.invalid;
    } else {
      return true;
    }
  }
}
