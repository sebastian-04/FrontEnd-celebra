import {inject, Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Subject} from 'rxjs';
import {Anfitrion} from '../model/anfitrion';
import {Distrito} from '../model/distrito';
import {TipoEvento} from '../model/tipoEvento';

@Injectable({
  providedIn: 'root'
})
export class DistritoServices {
  private url = environment.apiUrl;
  private httpClient: HttpClient = inject(HttpClient);
  private listaCambio: Subject<Distrito[]> = new Subject<Distrito[]>();
  constructor() {}
  insert(distrito: Distrito){
    return this.httpClient.post(this.url + '/distrito', distrito)
  }
  modify(distrito: Distrito){
    return this.httpClient.put(this.url + '/distrito', distrito)
  }
  delete(id:number){
    return this.httpClient.delete(this.url + '/distrito/' + id)
  }
  listar(){
    return this.httpClient.get<Distrito[]>(this.url + '/distritos');
  }
}
