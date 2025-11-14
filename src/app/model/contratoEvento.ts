import {Anfitrion} from './anfitrion';
import {Evento} from './evento';

export class ContratoEvento {
  id?: number;
  anfitrion: Anfitrion;
  evento: Evento;
  fechacontrato: Date;
  fechafinalizacion: Date;
  estado: String;
}
