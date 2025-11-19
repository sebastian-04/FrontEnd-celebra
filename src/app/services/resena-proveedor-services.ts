import {inject, Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {ResenaEvento} from '../model/resenaEvento';
import {ResenaProveedor} from '../model/resenaProveedor';

@Injectable({
  providedIn: 'root'
})
export class ResenaProveedorServices {
  private url = environment.apiUrl;
  private httpclient: HttpClient = inject(HttpClient);
  constructor(){}
  registrar(resenaProveedor: ResenaProveedor){
    return this.httpclient.post(this.url + '/reseñaproveedor', resenaProveedor);
  }
  actualizar(resenaProveedor: ResenaProveedor){
    return this.httpclient.put(this.url + '/reseñaproveedor', resenaProveedor);
  }
  eliminar(id: number){
    return this.httpclient.delete(this.url + '/reseñaproveedor/' + id);
  }
  listarResenaProveedorSegunProveedor(id:number){
    return this.httpclient.get<ResenaEvento[]>(this.url + '/reseñaproveedores/idproveedor/' + id)
  }
}
