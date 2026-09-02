import { z } from "zod";

export const cuponIdParamsSchema = z.object({ id: z.string().min(1) });
export const cuponHotelParamsSchema = z.object({ id_booking: z.string().min(1) });
export const cuponVueloParamsSchema = z.object({ id_viaje_aereo: z.string().min(1) });
export const cuponAutoParamsSchema = z.object({ id_renta_autos: z.string().min(1) });

export interface CuponUnificadoResponse {
  success: true;
  data: {
    id_solicitud: string;
    tipo_servicio: "hotel" | "vuelo" | "renta_carros";
    codigo_confirmacion: string;
    detalles: unknown;
  };
}

export interface CuponHotelResponse {
  success: true;
  data: {
    id_booking: string;
    codigo_confirmacion: string;
    titular: string;
    hotel: {
      nombre: string;
      direccion: string;
      telefono?: string;
    };
    estancia: {
      check_in: string;
      check_out: string;
      noches: number;
      habitacion: string;
      desayuno_incluido: boolean;
    };
    notas?: string;
  };
}

export interface CuponVueloResponse {
  success: true;
  data: {
    id_viaje_aereo: string;
    codigo_confirmacion: string;
    pasajero: string;
    tramos: Array<{
      sentido: "ida" | "vuelta";
      aerolinea: string;
      numero_vuelo: string;
      origen: { iata: string; ciudad: string };
      destino: { iata: string; ciudad: string };
      salida: string;
      llegada: string;
    }>;
    equipaje: {
      personal: string;
      mano: string;
      documentado: string;
    };
  };
}

export interface CuponAutoResponse {
  success: true;
  data: {
    id_renta_autos: string;
    codigo_confirmacion: string;
    conductor: string;
    auto: {
      arrendadora: string;
      modelo: string;
      transmision: string;
    };
    recogida: {
      sucursal: string;
      direccion: string;
      fecha: string;
      hora: string;
    };
    devolucion: {
      sucursal: string;
      direccion: string;
      fecha: string;
      hora: string;
    };
    seguro_incluido: boolean;
  };
}
