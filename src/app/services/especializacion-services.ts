import {inject, Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Subject} from 'rxjs';
import {Anfitrion} from '../model/anfitrion';
import {Especializacion} from '../model/especializacion';

@Injectable({
  providedIn: 'root'
})
export class EspecializacionServices {
  private url = environment.apiUrl;
  private httpClient: HttpClient = inject(HttpClient);
  private listaCambio: Subject<Especializacion[]> = new Subject<Especializacion[]>();
  constructor() {}
  insert(especializacion: Especializacion){
    return this.httpClient.post(this.url + '/especializacion', especializacion)
  }
  modify(especializacion: Especializacion){
    return this.httpClient.put(this.url + '/especializacion', especializacion)
  }
  delete(id:number){
    return this.httpClient.delete(this.url + '/especializacion/' + id)
  }
  listar(){
    return this.httpClient.get<Especializacion[]>(this.url + '/especializacion');
  }
}
