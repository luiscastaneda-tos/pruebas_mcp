import type { QueryExecutor } from "../../core/config/db.js";
import { NotFoundError } from "../../core/errors/index.js";
import {
  resolverCupon,
  selectAgenteExists,
  selectDetalleAuto,
  selectDetalleHotel,
  selectDetalleVueloCabecera,
  selectDetalleVueloTramos,
  type RawCuponAutoRow,
  type RawCuponHotelRow,
  type RawCuponRow,
  type RawCuponVueloCabeceraRow,
  type RawCuponVueloTramoRow,
} from "./cupones.repository.js";
import type {
  CuponAutoResponse,
  CuponHotelResponse,
  CuponUnificadoResponse,
  CuponVueloResponse,
} from "./cupones.schema.js";

function cleanText(value: string | null): string {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

function fullName(...parts: Array<string | null>): string {
  return parts.map(cleanText).filter((part) => part.length > 0).join(" ");
}

function databaseBoolean(value: boolean | number | string | null): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (value === null) return false;
  return ["1", "true", "si", "sí", "yes"].includes(value.trim().toLowerCase());
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const start = Date.parse(`${checkIn}T00:00:00Z`);
  const end = Date.parse(`${checkOut}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.max(0, Math.round((end - start) / 86_400_000));
}

function dateTime(date: string | null, time: string | null): string {
  const cleanDate = cleanText(date);
  const cleanTime = cleanText(time);
  if (cleanDate.length === 0) return cleanTime;
  if (cleanTime.length === 0 || cleanDate.includes("T")) return cleanDate;
  return `${cleanDate}T${cleanTime}`;
}

function formatHotel(row: RawCuponHotelRow): CuponHotelResponse {
  const data: CuponHotelResponse["data"] = {
    id_booking: row.id_booking,
    codigo_confirmacion: row.codigo_confirmacion,
    titular: fullName(
      row.primer_nombre,
      row.segundo_nombre,
      row.apellido_paterno,
      row.apellido_materno,
    ),
    hotel: {
      nombre: cleanText(row.hotel),
      direccion: cleanText(row.direccion),
    },
    estancia: {
      check_in: row.check_in,
      check_out: row.check_out,
      noches: nightsBetween(row.check_in, row.check_out),
      habitacion: cleanText(row.room),
      desayuno_incluido: databaseBoolean(row.incluye_desayuno),
    },
  };

  const notas = cleanText(row.comentarios);
  if (notas.length > 0) data.notas = notas;

  return { success: true, data };
}

function formatTramo(row: RawCuponVueloTramoRow): CuponVueloResponse["data"]["tramos"][number] {
  return {
    sentido: row.fly_type === "vuelta" ? "vuelta" : "ida",
    aerolinea: cleanText(row.airline),
    numero_vuelo: cleanText(row.flight_number),
    origen: {
      iata: cleanText(row.departure_airport),
      ciudad: cleanText(row.departure_city),
    },
    destino: {
      iata: cleanText(row.arrival_airport),
      ciudad: cleanText(row.arrival_city),
    },
    salida: dateTime(row.departure_date, row.departure_time),
    llegada: dateTime(row.arrival_date, row.arrival_time),
  };
}

function formatVuelo(
  header: RawCuponVueloCabeceraRow,
  rows: RawCuponVueloTramoRow[],
): CuponVueloResponse {
  const baggage = rows[0];
  return {
    success: true,
    data: {
      id_viaje_aereo: header.id_viaje_aereo,
      codigo_confirmacion: cleanText(header.codigo_confirmacion),
      pasajero: fullName(
        header.primer_nombre,
        header.segundo_nombre,
        header.apellido_paterno,
        header.apellido_materno,
      ),
      tramos: rows.map(formatTramo),
      equipaje: {
        personal: cleanText(baggage?.eq_personal ?? null),
        mano: cleanText(baggage?.eq_mano ?? null),
        documentado: cleanText(baggage?.eq_documentado ?? null),
      },
    },
  };
}

function formatAuto(idRentaAutos: string, row: RawCuponAutoRow): CuponAutoResponse {
  const joinedName = fullName(
    row.primer_nombre,
    row.segundo_nombre,
    row.apellido_paterno,
    row.apellido_materno,
  );

  return {
    success: true,
    data: {
      id_renta_autos: idRentaAutos,
      codigo_confirmacion: cleanText(row.codigo_confirmation),
      conductor: joinedName.length > 0 ? joinedName : cleanText(row.conductor_principal),
      auto: {
        arrendadora: cleanText(row.nombre_proveedor),
        modelo: cleanText(row.tipo_auto),
        transmision: cleanText(row.transmission),
      },
      recogida: {
        sucursal: cleanText(row.nombre_sucursal_recoger ?? row.lugar_recoger_auto),
        direccion: cleanText(row.direccion_recoger),
        fecha: cleanText(row.check_in),
        hora: cleanText(row.hora_recoger_auto),
      },
      devolucion: {
        sucursal: cleanText(row.nombre_sucursal_dejar ?? row.lugar_dejar_auto),
        direccion: cleanText(row.direccion_dejar),
        fecha: cleanText(row.check_out),
        hora: cleanText(row.hora_dejar_auto),
      },
      seguro_incluido: databaseBoolean(row.seguro_incluido),
    },
  };
}

function publicServiceType(type: RawCuponRow["type"]): CuponUnificadoResponse["data"]["tipo_servicio"] {
  if (type === "flyght" || type === "vuelo") return "vuelo";
  if (type === "car_rental" || type === "auto") return "renta_carros";
  return "hotel";
}

export class CuponesService {
  private async assertAgentExists(idAgente: string, executor: QueryExecutor): Promise<void> {
    const rows = await selectAgenteExists(executor, [idAgente]);
    if (rows.length === 0) throw new NotFoundError("Agente", idAgente);
  }

  private async findHotel(
    params: readonly unknown[],
    requestedId: string,
    executor: QueryExecutor,
  ): Promise<CuponHotelResponse> {
    const rows = await selectDetalleHotel(executor, params);
    const row = rows[0];
    if (row === undefined) throw new NotFoundError("Cupón", requestedId);
    return formatHotel(row);
  }

  private async findVuelo(
    idViajeAereo: string,
    requestedId: string,
    executor: QueryExecutor,
  ): Promise<CuponVueloResponse> {
    const [headers, tramos] = await Promise.all([
      selectDetalleVueloCabecera(executor, [idViajeAereo]),
      selectDetalleVueloTramos(executor, [idViajeAereo]),
    ]);
    const header = headers[0];
    if (header === undefined) throw new NotFoundError("Cupón", requestedId);
    return formatVuelo(header, tramos);
  }

  private async findAuto(
    idRentaAutos: string,
    requestedId: string,
    executor: QueryExecutor,
  ): Promise<CuponAutoResponse> {
    const rows = await selectDetalleAuto(executor, [idRentaAutos]);
    const row = rows[0];
    if (row === undefined) throw new NotFoundError("Cupón", requestedId);
    return formatAuto(idRentaAutos, row);
  }

  public async getCuponUnificado(
    id: string,
    idAgente: string,
    executor: QueryExecutor,
  ): Promise<CuponUnificadoResponse> {
    await this.assertAgentExists(idAgente, executor);
    const resolvedRows = await resolverCupon(executor, [id, id, id]);
    const resolved = resolvedRows[0];
    if (resolved === undefined) throw new NotFoundError("Cupón", id);

    let detail: CuponHotelResponse | CuponVueloResponse | CuponAutoResponse;
    if (resolved.type === "hotel") {
      detail = await this.findHotel(
        [resolved.id_solicitud_client, resolved.id_booking, resolved.id_relacion],
        id,
        executor,
      );
    } else if (resolved.type === "flyght" || resolved.type === "vuelo") {
      detail = await this.findVuelo(resolved.id_relacion, id, executor);
    } else {
      detail = await this.findAuto(resolved.id_relacion, id, executor);
    }

    return {
      success: true,
      data: {
        id_solicitud: resolved.id_solicitud_client,
        tipo_servicio: publicServiceType(resolved.type),
        codigo_confirmacion: detail.data.codigo_confirmacion,
        detalles: detail.data,
      },
    };
  }

  public async getCuponHotel(
    idBooking: string,
    idAgente: string,
    executor: QueryExecutor,
  ): Promise<CuponHotelResponse> {
    await this.assertAgentExists(idAgente, executor);
    return this.findHotel([idBooking, idBooking, idBooking], idBooking, executor);
  }

  public async getCuponVuelo(
    idViajeAereo: string,
    idAgente: string,
    executor: QueryExecutor,
  ): Promise<CuponVueloResponse> {
    await this.assertAgentExists(idAgente, executor);
    return this.findVuelo(idViajeAereo, idViajeAereo, executor);
  }

  public async getCuponAuto(
    idRentaAutos: string,
    idAgente: string,
    executor: QueryExecutor,
  ): Promise<CuponAutoResponse> {
    await this.assertAgentExists(idAgente, executor);
    return this.findAuto(idRentaAutos, idRentaAutos, executor);
  }
}

export const cuponesService = new CuponesService();
