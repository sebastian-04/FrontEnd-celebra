import {Component, inject} from '@angular/core';
import {Administrador} from "../../administrador-header/administrador";
import {AdministradorNavBar} from '../administrador-nav-bar/administrador-nav-bar';
import {MatCard, MatCardContent, MatCardTitle} from '@angular/material/card';
import {MatButton} from '@angular/material/button';
import {MatToolbar, MatToolbarRow} from '@angular/material/toolbar';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatFormField} from '@angular/material/form-field';
import {MatInput, MatLabel} from '@angular/material/input';
import {MatSelect} from '@angular/material/select';
import {MatOption} from '@angular/material/core';
import {Ciudad} from '../../../model/ciudad';
import {ActivatedRoute, Router} from '@angular/router';
import {TipoEventoServices} from '../../../services/tipo-evento-services';
import {EspecializacionServices} from '../../../services/especializacion-services';
import {DistritoServices} from '../../../services/distrito-services';
import {CiudadServices} from '../../../services/ciudad-services';

@Component({
  selector: 'app-administrador-registrar',
  imports: [
    Administrador,
    AdministradorNavBar,
    MatCard,
    MatCardTitle,
    MatButton,
    MatToolbar,
    MatToolbarRow,
    MatCardContent,
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    MatLabel,
    MatSelect,
    MatOption,
  ],
  templateUrl: './administrador-registrar.html',
  styleUrl: './administrador-registrar.css',
})
export class AdministradorRegistrar {
  entidad = "";
  formTipoEvento: FormGroup;
  formEspecializacion: FormGroup;
  formCiudad: FormGroup;
  formDistrito: FormGroup;
  fb: FormBuilder = inject(FormBuilder);
  router: Router = inject(Router);
  route: ActivatedRoute = inject(ActivatedRoute);
  tipoEventoService = inject(TipoEventoServices);
  especializacionService = inject(EspecializacionServices);
  distritoService = inject(DistritoServices);
  ciudadService = inject(CiudadServices);
  ciudad: Ciudad[] = [];
  edicion: boolean = false;
  id: number;
  constructor(){
    this.formTipoEvento = this.fb.group({
      id: [''],
      nombre: ['', Validators.required],
    });
    this.formEspecializacion = this.fb.group({
      id: [''],
      nombre: ['', Validators.required],
    });
    this.formCiudad = this.fb.group({
      id: [''],
      nombre: ['', Validators.required],
    })
    this.formDistrito = this.fb.group({
      id: [''],
      nombre: ['', Validators.required],
      ciudad: ['', Validators.required],
    });
  }
  ngOnInit(){
    this.ciudadService.listar().subscribe(next =>{
      console.log("Ciudades cargadas correctamente.")
      this.ciudad = next;
    })
    this.route.params.subscribe(params => {
      this.id = params['id'];
      this.entidad = params['entidad'];
      this.edicion = params['id'] != null;
      if (!this.entidad && !this.edicion) {
        this.seleccionar('TipoEvento');
      }
      this.cargaForm();
    })
  }
  cargaForm(){
    if (this.edicion){
      if (this.entidad == "TipoEvento") {
        this.tipoEventoService.listarPorId(this.id).subscribe(next =>{
          this.formTipoEvento.patchValue({
            id: next.id,
            nombre: next.nombre
          })
        })
      } else if (this.entidad == "Especializacion"){
        this.especializacionService.listarPorId(this.id).subscribe(next =>{
          this.formEspecializacion.patchValue({
            id: next.id,
            nombre: next.nombre
          })
        })
      } else if (this.entidad == "Ciudad"){
        this.ciudadService.listarPorId(this.id).subscribe(next =>{
          this.formCiudad.patchValue({
            id: next.id,
            nombre: next.nombre
          })
        })
      } else if (this.entidad == "Distrito"){
        this.distritoService.listarPorId(this.id).subscribe(next =>{
          const ciudadSeleccionada = this.ciudad.find(
            ci => ci.id === next.ciudad.id
          );
          this.formDistrito.patchValue({
            id: next.id,
            nombre: next.nombre,
            ciudad: ciudadSeleccionada
          })
        })
      }
    }
  }
  seleccionar(nombre: string){
    this.entidad = nombre;
    console.log("Entidad seleccionada:", this.entidad);
  }
  ngSubmit(){
    let tipoevento= this.formTipoEvento.value;
    let ciudad = this.formCiudad.value;
    let distrito = this.formDistrito.value;
    let especializacion = this.formEspecializacion.value;
    if (this.entidad == "TipoEvento") {
      if (this.formTipoEvento.valid){
        if (!this.edicion) {
          this.tipoEventoService.insert(tipoevento).subscribe(next => {
            console.log("Tipo de evento registrado correctamente.")
            this.router.navigate(['/administrador-listar']);
          })
        } else{
          this.tipoEventoService.modify(tipoevento).subscribe(next => {
            console.log("Tipo de evento modificado correctamente.")
            this.router.navigate(['/administrador-listar']);
          })
        }
      } else{
        console.log("Los datos ingresados en el formulario son inválidos")
        this.formTipoEvento.markAsTouched();
      }
    } else if (this.entidad == "Especializacion") {
      if (this.formEspecializacion.valid) {
        if (!this.edicion) {
          this.especializacionService.insert(especializacion).subscribe(next => {
            console.log("Especialización registrada correctamente.")
            this.router.navigate(['/administrador-listar']);
          })
        } else {
          this.especializacionService.modify(especializacion).subscribe(next => {
            console.log("Especialización modificada correctamente.")
            this.router.navigate(['/administrador-listar']);
          })
        }
      } else {
        console.log("Los datos ingresados en el formulario son inválidos")
        this.formEspecializacion.markAsTouched();
      }
    } else if (this.entidad == "Ciudad") {
      if (this.formCiudad.valid) {
        if (!this.edicion) {
          this.ciudadService.insert(ciudad).subscribe(next => {
            console.log("Ciudad registrada correctamente.")
            this.router.navigate(['/administrador-listar']);
          })
        } else {
          this.ciudadService.modify(ciudad).subscribe(next => {
            console.log("Ciudad modificada correctamente.")
            this.router.navigate(['/administrador-listar']);
          })
        }
      } else {
        console.log("Los datos ingresados en el formulario son inválidos")
        this.formCiudad.markAsTouched();
      }
    } else if (this.entidad == "Distrito") {
      if (this.formDistrito.valid) {
        if (!this.edicion) {
          this.distritoService.insert(distrito).subscribe(next => {
            console.log("Distrito registrado correctamente.")
            this.router.navigate(['/administrador-listar']);
          })
        } else {
          this.distritoService.modify(distrito).subscribe(next => {
            console.log("Distrito modificado correctamente.")
            this.router.navigate(['/administrador-listar']);
          })
        }
      } else{
        console.log("Los datos ingresados en el formulario son inválidos")
        this.formDistrito.markAsTouched();
      }
    }
  }
}
