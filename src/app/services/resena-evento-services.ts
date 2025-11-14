import {inject, Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {ResenaEvento} from '../model/resenaEvento';

@Injectable({
  providedIn: 'root'
})
export class ResenaEventoServices {
  private url = environment.apiUrl;
  private httpclient: HttpClient = inject(HttpClient);
  constructor(){}
  registrar(resenaEvento: ResenaEvento){
    return this.httpclient.post(this.url + '/reseñaevento', resenaEvento);
  }
  actualizar(resenaEvento: ResenaEvento){
    return this.httpclient.put(this.url + '/reseñaevento', resenaEvento);
  }
  eliminar(id: number){
    return this.httpclient.delete(this.url + '/reseñaevento/' + id);
  }
  listarResenaEventoSegunEventoYAnfitrion(idAnfitrion:number, idEvento: number){
    return this.httpclient.get<ResenaEvento[]>(`${this.url}/reseñaeventos/idAnfitrion/idEvento/${idAnfitrion}/${idEvento}`)
  }
  listarResenaEventoSegunEvento(id: number){
    return this.httpclient.get<ResenaEvento[]>(this.url + '/reseñaeventos/idevento/' + id);
  }
  listarResenaEventos(){
    return this.httpclient.get<ResenaEvento[]>(this.url + '/reseñaeventos');
  }
}
