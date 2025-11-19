import {inject, Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Subject} from 'rxjs';
import {Anfitrion} from '../model/anfitrion';

@Injectable({
  providedIn: 'root'
})
export class AnfitrionServices {
  private url = environment.apiUrl;
  private httpClient: HttpClient = inject(HttpClient);
  private listaCambio: Subject<Anfitrion[]> = new Subject<Anfitrion[]>();
  constructor() {}
  listarPorId(id:number){
    return this.httpClient.get<Anfitrion>(this.url + '/anfitrion/id/' + id)
  }
  registrar(anfitrion: Anfitrion){
    return this.httpClient.post(this.url + '/anfitrion', anfitrion)
  }
  listar(){
    return this.httpClient.get<Anfitrion[]>(this.url + '/anfitriones');
  }
  eliminar(id: number){
    return this.httpClient.delete(this.url + '/anfitrion/' + id);
  }
  actualizar(anfitrion: Anfitrion){
    return this.httpClient.put(this.url + '/anfitrion', anfitrion);
  }
  listarPorCorreo(correo: String){
    return this.httpClient.get<Anfitrion>(this.url + '/anfitrion/correo/' + correo)
  }
}
