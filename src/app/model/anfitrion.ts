export class Anfitrion{
  id?: number;
  nombre: string;
  apellido: string;
  dni: number;
  email: string;
  telefono: string;
  contrasena: string;
  foto?: string;
  estado: boolean;
  descripcion?: string;
  role?:{
    id: number;
    name: string;
  };
}
