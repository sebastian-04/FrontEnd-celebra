import {inject, Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {ValoracionEvento} from '../model/valoracionEvento';

@Injectable({
  providedIn: 'root'
})
export class ValoracionEventoServices {
  private url = environment.apiUrl;
  private httpclient: HttpClient = inject(HttpClient);
  constructor(){}
  alternarFavorito(idAnfitrion: number, idEvento: number, valoracionEvento: ValoracionEvento){
    return this.httpclient.post(this.url + '/alternarfavorito/' + idAnfitrion + '/' + idEvento, valoracionEvento);
  }
  listarValoracionEventoPorAnfitrion(id: number){
    return this.httpclient.get<ValoracionEvento[]>(this.url + '/valoracioneventos/' + id);
  }
}
