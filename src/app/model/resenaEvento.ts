import {Evento} from './evento';
import {Anfitrion} from './anfitrion';

export class ResenaEvento {
  id?: number;
  evento: Evento;
  anfitrion: Anfitrion;
  observacion: string;
  valoracion: number;
}
