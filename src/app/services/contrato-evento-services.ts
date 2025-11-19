import {inject, Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {ContratoEvento} from '../model/contratoEvento';

@Injectable({
  providedIn: 'root'
})
export class ContratoEventoServices {
  private url = environment.apiUrl;
  private httpclient: HttpClient = inject(HttpClient);
  constructor(){}
  historialEventoSegunAnfitrionPorFechaMasAntigua(id: number){
    return this.httpclient.get<ContratoEvento[]>(this.url + '/evento/anfitrion/fecha/antigua/' + id)
  }
  historialEventoSegunAnfitrionPorFechaMasReciente(id: number){
    return this.httpclient.get<ContratoEvento[]>(this.url + '/evento/anfitrion/fecha/reciente/' + id)
  }
  historialEventoSegunAnfitrionPorMayorPresupuesto(id: number){
    return this.httpclient.get<ContratoEvento[]>(this.url + '/evento/anfitrion/presupuesto/mayor/' + id)
  }
  historialEventoSegunAnfitrionPorMenorPresupuesto(id: number){
    return this.httpclient.get<ContratoEvento[]>(this.url + '/evento/anfitrion/presupuesto/menor/' + id)
  }
  historialEventoSegunAnfitrionPorMejorValoracion(id: number){
    return this.httpclient.get<ContratoEvento[]>(this.url + '/evento/anfitrion/valoracion/mayor/' + id)
  }
  historialEventoSegunAnfitrionPorPeorValoracion(id: number){
    return this.httpclient.get<ContratoEvento[]>(this.url + '/evento/anfitrion/valoracion/menor/' + id)
  }
  historialContratosSegunProveedorPorFechaMasReciente(id: number){
    return this.httpclient.get<ContratoEvento[]>(this.url + '/contrato/proveedor/fecha/reciente/' + id)
  }
  historialContratosSegunProveedorPorFechaMasAntigua(id: number){
    return this.httpclient.get<ContratoEvento[]>(this.url + '/contrato/proveedor/fecha/antigua/' + id)
  }
  historialContratosSegunProveedorPorMayorPresupuesto(id: number){
    return this.httpclient.get<ContratoEvento[]>(this.url + '/contrato/proveedor/presupuesto/mayor/' + id)
  }
  historialContratosSegunProveedorPorMenorPresupuesto(id: number){
    return this.httpclient.get<ContratoEvento[]>(this.url + '/contrato/proveedor/presupuesto/menor/' + id)
  }
  historialContratosSegunProveedorPorMejorValoracion(id: number){
    return this.httpclient.get<ContratoEvento[]>(this.url + '/contrato/proveedor/valoracion/mayor/' + id)
  }
  historialContratosSegunProveedorPorPeorValoracion(id: number){
    return this.httpclient.get<ContratoEvento[]>(this.url + '/contrato/proveedor/valoracion/menor/' + id)
  }
  eventoContratado(contratoEvento: ContratoEvento){
    return this.httpclient.post(this.url + '/evento/contratado', contratoEvento)
  }
  eventoFinalizado(contratoEvento: ContratoEvento){
    return this.httpclient.put(this.url + '/evento/finalizado', contratoEvento)
  }
  verEventosContratadosPorIdAnfitrion(id: number){
    return this.httpclient.get<ContratoEvento[]>(this.url + '/eventos/actuales/anfitrion/' + id);
  }
  verContratosContratadosPorIdProveedor(id: number){
    return this.httpclient.get<ContratoEvento[]>(this.url + '/contrato/actuales/proveedor/' + id);
  }
}
