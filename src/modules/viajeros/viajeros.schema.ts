import { z } from "zod";

export const viajerosQuerySchema = z.object({
  busqueda: z.string().optional(),
});

export interface ViajeroItem {
  id_viajero: string;
  nombre_completo: string;
  correo: string | null;
  numero_empleado: string | null;
  telefono: string | null;
}
