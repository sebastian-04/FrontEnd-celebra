import {inject, Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable , Subject} from 'rxjs';
import {ImagenEvento} from '../model/imagenEvento';

@Injectable({
  providedIn: 'root'
})
export class ImagenEventoService {
  private url = environment.apiUrl;
  private httpClient: HttpClient = inject(HttpClient);
  private listaCambio: Subject<ImagenEvento[]> = new Subject<ImagenEvento[]>();
  constructor() {}
  listarPorIdEvento(id:number){
    return this.httpClient.get<ImagenEvento[]>(this.url + "/imagenesevento/" + id);
  }
  insert(imagenEvento:ImagenEvento){
    return this.httpClient.post(this.url + "/imagenevento", imagenEvento);
  }
  update(imagenEvento:ImagenEvento){
    return this.httpClient.put(this.url + "/imagenevento", imagenEvento);
  }
  delete(id:number){
    return this.httpClient.delete(this.url + "/imagenevento/" + id);
  }
}
