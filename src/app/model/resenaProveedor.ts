import {Anfitrion} from './anfitrion';
import {Proveedor} from './proveedor';

export class ResenaProveedor {
  id: number;
  anfitrion: Anfitrion;
  proveedor: Proveedor;
  descripcion: string;
  valoracion: number;
}
