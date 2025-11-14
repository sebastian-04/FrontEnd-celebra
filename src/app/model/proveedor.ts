import {Especializacion} from './especializacion';

export class Proveedor {
  id?: number;
  especializacion: Especializacion;
  email: string;
  ruc: string;
  numerocontacto: string;
  nombreorganizacion: string;
  contrasena: string;
  direccion: string;
  foto?: string;
  ganancia: number;
  valoracion: number;
  estado: boolean;
  descripcion?: string;
  role?:{
    id: number;
    name: string;
  };
}
