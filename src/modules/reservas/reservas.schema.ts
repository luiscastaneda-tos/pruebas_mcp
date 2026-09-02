import { z } from "zod";

const dateSchema = z.iso.date();

export const reservasFilterSchema = z
  .object({
    temporalidad: z.enum(["proximas", "en_curso", "pasadas", "todas"]),
    id_viajero: z.string().optional(),
    tipo_servicio: z.enum(["hotel", "vuelo", "renta_carros", "todos"]).optional(),
    codigo_confirmacion: z.string().optional(),
    startDate: dateSchema.optional(),
    endDate: dateSchema.optional(),
    page: z.number().int().positive().default(1),
    length: z.number().int().min(1).max(20).default(10),
  })
  .superRefine((input, context) => {
    if (input.startDate !== undefined && input.endDate === undefined) {
      context.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "endDate es requerido cuando se proporciona startDate.",
      });
    }

    if (input.endDate !== undefined && input.startDate === undefined) {
      context.addIssue({
        code: "custom",
        path: ["startDate"],
        message: "startDate es requerido cuando se proporciona endDate.",
      });
    }

    if (
      input.startDate !== undefined &&
      input.endDate !== undefined &&
      input.startDate > input.endDate
    ) {
      context.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "endDate debe ser mayor o igual a startDate.",
      });
    }
  });

export type ReservasFilterInput = z.infer<typeof reservasFilterSchema>;

export interface ReservaItem {
  id_booking: string;
  id_relacion: string;
  id_solicitud_client: string;
  type: "vuelo" | "hotel" | "renta_carros";
  codigo_confirmacion: string;
  proveedor: string;
  nombre_viajero: string;
  check_in: string;
  check_out: string;
  estado: string;
  total: number;
  metodo_pago: string;
}

export interface Metadata {
  total: number;
  page: number;
  length: number;
}

export interface Respuesta {
  success: true;
  data: ReservaItem[];
  metadata: Metadata;
}

export type ReservasResponse = Respuesta;
