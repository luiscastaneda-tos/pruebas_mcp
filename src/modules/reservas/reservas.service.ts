import type { QueryExecutor } from "../../core/config/db.js";
import { countReservas, selectReservas, type RawReservaRow } from "./reservas.repository.js";
import type {
  ReservaItem,
  ReservasFilterInput,
  ReservasResponse,
} from "./reservas.schema.js";

type InternalServiceType = RawReservaRow["type"] | null;

function getTodayInMexico(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function toInternalServiceType(
  type: ReservasFilterInput["tipo_servicio"],
): InternalServiceType {
  switch (type) {
    case "vuelo":
      return "flyght";
    case "renta_carros":
      return "car_rental";
    case "hotel":
      return "hotel";
    case "todos":
    case undefined:
      return null;
  }
}

function toPublicServiceType(type: RawReservaRow["type"]): ReservaItem["type"] {
  switch (type) {
    case "flyght":
      return "vuelo";
    case "car_rental":
      return "renta_carros";
    case "hotel":
      return "hotel";
  }
}

function normalizeReserva(row: RawReservaRow): ReservaItem {
  return {
    id_booking: row.id_booking,
    id_relacion: row.id_relacion,
    id_solicitud_client: row.id_solicitud_client,
    type: toPublicServiceType(row.type),
    codigo_confirmacion: row.codigo_confirmacion,
    proveedor: row.proveedor,
    nombre_viajero: row.nombre_viajero.trim().replace(/\s+/g, " "),
    check_in: row.check_in,
    check_out: row.check_out,
    estado: row.estado,
    total: row.total,
    metodo_pago: row.metodo_pago,
  };
}

function buildFilterParams(
  input: ReservasFilterInput,
  idAgente: string,
  today: string,
): readonly unknown[] {
  const idViajero = input.id_viajero ?? null;
  const serviceType = toInternalServiceType(input.tipo_servicio);
  const confirmationCode = input.codigo_confirmacion ?? null;
  const startDate = input.startDate ?? null;
  const endDate = input.endDate ?? null;

  return [
    idAgente,
    input.temporalidad,
    input.temporalidad,
    today,
    input.temporalidad,
    today,
    today,
    input.temporalidad,
    today,
    idViajero,
    idViajero,
    serviceType,
    serviceType,
    confirmationCode,
    confirmationCode,
    startDate,
    startDate,
    endDate,
    endDate,
  ];
}

export class ReservasService {
  public async filtrar(
    input: ReservasFilterInput,
    idAgente: string,
    executor: QueryExecutor,
  ): Promise<ReservasResponse> {
    const filterParams = buildFilterParams(input, idAgente, getTodayInMexico());
    const selectParams = [
      ...filterParams,
      input.temporalidad,
      input.temporalidad,
      input.temporalidad,
      input.length,
      (input.page - 1) * input.length,
    ];

    const [rows, countRows] = await Promise.all([
      selectReservas(executor, selectParams),
      countReservas(executor, filterParams),
    ]);

    return {
      success: true,
      data: rows.map(normalizeReserva),
      metadata: {
        total: countRows[0]?.total ?? 0,
        page: input.page,
        length: input.length,
      },
    };
  }
}

export const reservasService = new ReservasService();
