import {inject, Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Subject} from 'rxjs';
import {Anfitrion} from '../model/anfitrion';
import {TipoEvento} from '../model/tipoEvento';
import {Especializacion} from '../model/especializacion';

@Injectable({
  providedIn: 'root'
})
export class TipoEventoServices {
  private url = environment.apiUrl;
  private httpClient: HttpClient = inject(HttpClient);
  private listaCambio: Subject<TipoEvento[]> = new Subject<TipoEvento[]>();
  constructor() {}
  insert(tipoEvento: TipoEvento){
    return this.httpClient.post(this.url + '/tipoevento', tipoEvento)
  }
  modify(tipoEvento: TipoEvento){
    return this.httpClient.put(this.url + '/tipoevento', tipoEvento)
  }
  delete(id:number){
    return this.httpClient.delete(this.url + '/tipoevento/' + id)
  }
  listar(){
    return this.httpClient.get<TipoEvento[]>(this.url + '/tipoeventos');
  }
}
