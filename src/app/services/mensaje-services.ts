import {inject, Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Chat} from '../model/chat';
import {Mensaje} from '../model/mensaje';

@Injectable({
  providedIn: 'root'
})
export class MensajeServices {
  private url = environment.apiUrl;
  private httpclient: HttpClient = inject(HttpClient);
  constructor(){}
  enviar(id:number, mensaje: Mensaje){
    return this.httpclient.post(this.url + '/mensaje/' + id, mensaje)
  }
  listarPorChat(id:number){
    return this.httpclient.get<Mensaje[]>(this.url + '/mensaje/' + id)
  }
  deletePorChat(id:number){
    return this.httpclient.delete(this.url + '/mensaje/' + id)
  }
  editarMensaje(id:number, mensaje: Mensaje){
    return this.httpclient.put(this.url + '/mensaje/' + id, mensaje)
  }
}
