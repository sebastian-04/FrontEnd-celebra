import {Anfitrion} from './anfitrion';
import {Proveedor} from './proveedor';

export class Chat{
  id: number;
  fechacreacion: Date;
  fechaultimomensaje: Date;
  estado: string;
  anfitrion: Anfitrion;
  proveedor: Proveedor;
}
