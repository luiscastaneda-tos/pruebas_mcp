import type { QueryExecutor } from "../../core/config/db.js";
import { NotFoundError } from "../../core/errors/index.js";
import {
  selectAgenteExists,
  selectViajeros,
  type RawViajeroRow,
} from "./viajeros.repository.js";
import type { ViajeroItem } from "./viajeros.schema.js";

function mapViajero(row: RawViajeroRow): ViajeroItem {
  const nombreCompleto = [
    row.primer_nombre ?? "",
    row.segundo_nombre ?? "",
    row.apellido_paterno ?? "",
    row.apellido_materno ?? "",
  ]
    .map((parte) => parte.trim())
    .filter((parte) => parte.length > 0)
    .join(" ");

  return {
    id_viajero: row.id_viajero,
    nombre_completo: nombreCompleto,
    correo: row.correo,
    numero_empleado: row.numero_empleado,
    telefono: row.telefono,
  };
}

export class ViajerosService {
  private async assertAgentExists(idAgente: string, executor: QueryExecutor): Promise<void> {
    const rows = await selectAgenteExists(executor, [idAgente]);
    if (rows.length === 0) throw new NotFoundError("Agente", idAgente);
  }

  public async listar(
    idAgente: string,
    params: readonly unknown[],
    executor: QueryExecutor,
  ): Promise<ViajeroItem[]> {
    await this.assertAgentExists(idAgente, executor);
    const rows = await selectViajeros(executor, params);
    return rows.map(mapViajero);
  }
}

export const viajerosService = new ViajerosService();
