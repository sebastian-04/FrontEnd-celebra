import {inject, Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Chat} from '../model/chat';

@Injectable({
  providedIn: 'root'
})
export class ChatServices {
  private url = environment.apiUrl;
  private httpclient: HttpClient = inject(HttpClient);
  constructor(){}
  listar(){
    return this.httpclient.get<Chat[]>(this.url + '/chats')
  }
  listarPorAnfitrion(id:number){
    return this.httpclient.get<Chat[]>(this.url + '/chats/anfitrion/' + id)
  }
  listarPorProveedor(id:number){
    return this.httpclient.get<Chat[]>(this.url + '/chats/proveedor/' + id)
  }
}
