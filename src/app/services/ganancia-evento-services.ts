import {inject, Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {GananciaEvento} from '../model/gananciaEvento';

@Injectable({
  providedIn: 'root'
})
export class GananciaEventoServices {
  private url = environment.apiUrl;
  private httpclient: HttpClient = inject(HttpClient);
  constructor(){}
  registrar(gananciaEvento: GananciaEvento){
    return this.httpclient.post(this.url + '/gananciaevento', gananciaEvento)
  }
}
