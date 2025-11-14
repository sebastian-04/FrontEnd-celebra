import {inject, Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable , Subject} from 'rxjs';
import {Evento} from '../model/evento';
import {Anfitrion} from '../model/anfitrion';

@Injectable({
  providedIn: 'root',
})
export class EventoService {
  private url = environment.apiUrl;
  private httpClient: HttpClient = inject(HttpClient);
  private listaCambio: Subject<Evento[]> = new Subject<Evento[]>();
  constructor() {}
  listar(){
    return this.httpClient.get<Evento[]>(this.url + "/eventos/aleatorios");
  }
  registrar(evento: Evento){
    return this.httpClient.post(this.url + "/evento", evento);
  }
  listarPorId(id: Number){
    return this.httpClient.get<Evento>(this.url + '/evento/' + id)
  }
  listarPorIdProveedor(id: number){
    return this.httpClient.get<Evento[]>(this.url + '/evento/proveedor/' + id)
  }
  listarFiltroBasico(id: number, aforo: number, fechainicio: Date): Observable<Evento[]> {
    const fechaStr = fechainicio.toISOString().split('T')[0];
    return this.httpClient.get<Evento[]>(`${this.url}/eventosfiltrado/${id}/${aforo}/${fechaStr}`);
  }
  listarFiltroAvanzado(idDistrito: number, idTipoEvento: number, fechainicio: Date, fechafin: Date, aforoMin: number, aforoMax: number, presupuestoMin: number, presupuestoMax: number){
    const fechaStr1 = fechainicio.toISOString().split('T')[0];
    const fechaStr2 = fechafin.toISOString().split('T')[0];
    return this.httpClient.get<Evento[]>(`${this.url}/eventosfiltrados/${idDistrito}/${idTipoEvento}/${fechaStr1}/${fechaStr2}/${aforoMin}/${aforoMax}/${presupuestoMin}/${presupuestoMax}`);
  }
  eliminar(id: number){
    return this.httpClient.delete(this.url + '/evento/' + id);
  }
  modificar(evento: Evento){
    return this.httpClient.put(this.url + '/evento', evento);
  }
}
