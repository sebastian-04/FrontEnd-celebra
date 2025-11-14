import {Proveedor} from './proveedor';
import {GananciaEvento} from './gananciaEvento';

export class ReporteProveedor {
  id: number;
  proveedor: Proveedor;
  descripcion: string;
  gananciaevento: GananciaEvento;
}
