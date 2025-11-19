import {inject, Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Subject} from 'rxjs';
import {Proveedor} from '../model/proveedor';

@Injectable({
  providedIn: 'root'
})
export class ProveedorServices {
  private url = environment.apiUrl;
  private httpClient: HttpClient = inject(HttpClient);
  private listaCambio: Subject<Proveedor[]> = new Subject<Proveedor[]>();
  constructor() {}
  listarPorId(id:number){
    return this.httpClient.get<Proveedor>(this.url + '/proveedor/id/' + id)
  }
  registrar(proveedor: Proveedor){
    return this.httpClient.post(this.url + '/proveedor', proveedor)
  }
  listar(){
    return this.httpClient.get<Proveedor[]>(this.url + '/proveedores');
  }
  eliminar(id: number){
    return this.httpClient.delete(this.url + '/proveedor/' + id);
  }
  actualizar(proveedor: Proveedor){
    return this.httpClient.put(this.url + '/proveedor', proveedor);
  }
  listarPorCorreo(correo: String){
    return this.httpClient.get<Proveedor>(this.url + '/proveedor/correo/' + correo)
  }
}
