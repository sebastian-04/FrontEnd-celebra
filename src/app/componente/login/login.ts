import {Component, inject, signal} from '@angular/core';
import {Router, RouterLink, RouterModule, RouterOutlet} from '@angular/router';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {AnfitrionServices} from '../../../../../../../Downloads/Celebra FrontEnd - copia/Celebra FrontEnd - copia/src/app/services/anfitrion-services';
import {ProveedorServices} from '../../../../../../../Downloads/Celebra FrontEnd - copia/Celebra FrontEnd - copia/src/app/services/proveedor-services';
import {LoginService} from '../../../../../../../Downloads/Celebra FrontEnd - copia/Celebra FrontEnd - copia/src/app/services/login-service';
import {RequestDto} from '../../../../../../../Downloads/Celebra FrontEnd - copia/Celebra FrontEnd - copia/src/app/model/request-dto';
import {ResponseDto} from '../../../../../../../Downloads/Celebra FrontEnd - copia/Celebra FrontEnd - copia/src/app/model/response-dto';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  email: string = '';
  contrasena: string = '';
  anfitrionService: AnfitrionServices = inject(AnfitrionServices);
  proveedorService: ProveedorServices = inject(ProveedorServices);
  router: Router = inject(Router);
  correoAdministrador: string = 'admin@admin.com';
  contrasenaAdministrador: string = 'admin';
  loginForm: FormGroup;
  fb: FormBuilder = inject(FormBuilder);
  loginService: LoginService = inject(LoginService);
  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      contrasena: ['', Validators.required],
    })
  }
  ngOnInit() {
    if(localStorage.getItem('token') != null){
      localStorage.clear();
      console.log("Token y items eliminados");
    }
    this.loadForm()
  }
  loadForm(): void {
    console.log("Form");
  }
  onSubmit() {
    if (!this.loginForm.valid) {
      alert("Formulario no válido!");
      return;
    }
    const email = this.loginForm.value.email;
    const contrasena = this.loginForm.value.contrasena;
    if (email === this.correoAdministrador && contrasena === this.contrasenaAdministrador) {
      console.log("Administrador detectado");
      const req = new RequestDto();
      req.username = email;
      req.password = contrasena;
      this.loginService.login(req).subscribe(data => {
        localStorage.setItem("token", data.jwt);
        localStorage.setItem("rol", "ROLE_ADMIN");
        this.router.navigate(['/administrador']);
      });
    }
    const requestDto = new RequestDto();
    requestDto.username = this.loginForm.value.email;
    requestDto.password = this.loginForm.value.contrasena;
    console.log("username: ", requestDto.username)
    console.log("password: ", requestDto.password)
    this.loginService.login(requestDto).subscribe({
      next: (data: ResponseDto) => {
        console.log("Respuesta login:", data);
        localStorage.setItem("token", data.jwt);
        const rol = data.roles[0];
        localStorage.setItem("rol", rol);
        if (rol === 'ROLE_ANFITRION') {
          this.anfitrionService.listarPorCorreo(email).subscribe(anfitrion => {
            this.router.navigate(['/menu-anfitrion', anfitrion.id]);
          });
        } else if (rol === 'ROLE_PROVEEDOR') {
          this.proveedorService.listarPorCorreo(email).subscribe(proveedor => {
            this.router.navigate(['/menu-proveedor', proveedor.id]);
          });
        } else {
          this.router.navigate(['/home']);
        }
      },
      error: (err) => {
        console.error(err);
        alert("Credenciales incorrectas");
        this.router.navigate(['/login']);
      }
    });
  }
}
