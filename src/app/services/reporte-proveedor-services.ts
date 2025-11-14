import {inject, Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {GananciaProveedorDTO} from '../model/gananciaProveedorDTO';

@Injectable({
  providedIn: 'root'
})
export class ReporteProveedorServices {
  private url = environment.apiUrl;
  private httpclient: HttpClient = inject(HttpClient);
  constructor(){}
  reporteUltimoAnio(idProveedor: number){
    const url = `${this.url}/reporteproveedor/alolargodeltiempo/${idProveedor}`;
    return this.httpclient.get<GananciaProveedorDTO[]>(url);
  }
  reporteUltimoMes(idProveedor: number){
    const url = `${this.url}/reporteproveedor/ultimomes/${idProveedor}`;
    return this.httpclient.get<GananciaProveedorDTO[]>(url);
  }
  reporteUltimoTresMeses(idProveedor: number){
    const url = `${this.url}/reporteproveedor/enlosultimos3meses/${idProveedor}`;
    return this.httpclient.get<GananciaProveedorDTO[]>(url);
  }
  reporteUltimoSeisMeses(idProveedor: number){
    const url = `${this.url}/reporteproveedor/enlosultimos6meses/${idProveedor}`;
    return this.httpclient.get<GananciaProveedorDTO[]>(url);
  }
}
