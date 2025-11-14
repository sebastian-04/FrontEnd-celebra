import {inject, Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Subject} from 'rxjs';
import {Anfitrion} from '../model/anfitrion';
import {Ciudad} from '../model/ciudad';
import {Distrito} from '../model/distrito';
import {TipoEvento} from '../model/tipoEvento';

@Injectable({
  providedIn: 'root'
})
export class CiudadServices {
  private url = environment.apiUrl;
  private httpClient: HttpClient = inject(HttpClient);
  private listaCambio: Subject<Ciudad[]> = new Subject<Ciudad[]>();
  constructor() {}
  insert(ciudad: Ciudad){
    return this.httpClient.post(this.url + '/ciudad', ciudad)
  }
  modify(ciudad: Ciudad){
    return this.httpClient.put(this.url + '/distrito', ciudad)
  }
  delete(id:number){
    return this.httpClient.delete(this.url + '/ciudad/' + id)
  }
  listar(){
    return this.httpClient.get<Ciudad[]>(this.url + '/ciudades');
  }
}
