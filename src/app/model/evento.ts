import {Proveedor} from './proveedor';
import {TipoEvento} from './tipoEvento';
import {Distrito} from './distrito';

export class Evento {
  id?: number;
  titulo: string;
  descripcion: string;
  proveedor: Proveedor;
  tipoevento: TipoEvento;
  fechainicio: Date;
  fechafin: Date;
  presupuesto: number;
  estado: string;
  valoracion: number;
  aforo: number;
  distrito: Distrito;

}
