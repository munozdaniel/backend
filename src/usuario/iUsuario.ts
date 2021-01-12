import { IDireccion } from 'direccion/iDireccion';
import { ITarjeta } from '../tarjeta/iTarjeta';
import * as mongoose from 'mongoose';
export interface IUsuario extends mongoose.Document {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  telefono: string;

  rol: 'CLIENTE' | 'ADMIN';

  identificacion?: string;
  fechaNacimiento?: Date;
  // tipo_identificacion:string;
  direccionActual?: IDireccion;
  direcciones?: IDireccion[];

  perfilCompleto: boolean; // Controla qeu todos los campos requeridos para una compra sean cargados

  observacion?: string; // Agregado por el dueño del comercio
  totalGastado: string;
  ultimaCompra: string; // id de la ultima orden
  tarjetaGuardada?: ITarjeta;

  fechaCreacion: Date;
  usuarioCreacion: string | null;
  fechaModificacion?: Date;
  usuarioModificacion?: string;
  activo: boolean;
}
