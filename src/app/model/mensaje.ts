import {Chat} from './chat';

export class Mensaje{
  id: number;
  contenido: string;
  fechaenvio: Date;
  tipoemisor: string;
  chat: Chat;
}
