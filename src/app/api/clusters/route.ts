import { NextResponse } from "next/server";
import { query } from "../../lib/db";
import scalerParams from "../../data/scaler_minmax.json";
import centroidsScaled from "../../data/centroides_scaled.json";
import {
  MinMaxParams,
  ScaledCentroid,
  minMaxScale,
  minMaxInverse,
  assignClusterScaled,
} from "../../lib/clustering";

const P = scalerParams as MinMaxParams; // feature_order de 4 dims
const C = centroidsScaled as ScaledCentroid[]; // centroides escalados

// Mapa nombre lógico -> columna real en BD
const DB_COLS: Record<string, string> = {
  Tem_BME280: `"tem_bme280"`,
  "MP1.0_AtE": `"mp1.0_ate"`, // ojo el punto en el alias lógico
  CO2_MHZ19: `"co2_mhz19"`,
  Rap_Viento: `"rap_viento"`,
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const dateParam = url.searchParams.get("date");
    const start = url.searchParams.get("start");
    const end = url.searchParams.get("end");

    // Armamos el SELECT con alias EXACTOS = nombres lógicos (con punto donde aplique)
    const selects = P.feature_order
      .map((f) => `${DB_COLS[f]} AS "${f}"`)
      .join(", ");

    // Construye SQL según rango (start,end) o fecha única (date)
    let sql: string;
    let params: any[];
    const notNull = P.feature_order.map((f) => `AND ${DB_COLS[f]} IS NOT NULL`).join(" ");

    if (start && end) {
      sql = `
        SELECT
          ${selects},
          "fecha_registro"
        FROM datos_dispositivo
        WHERE "fecha_registro"::date BETWEEN $1 AND $2
          ${notNull}
        ORDER BY "fecha_registro" ASC;
      `;
      params = [start, end];
    } else if (dateParam) {
      sql = `
        SELECT
          ${selects},
          "fecha_registro"
        FROM datos_dispositivo
        WHERE "fecha_registro"::date = $1
          ${notNull}
        ORDER BY "fecha_registro" ASC;
      `;
      params = [dateParam];
    } else {
      return NextResponse.json(
        { error: "Faltan parámetros: 'start' y 'end' o 'date' (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const result = await query(sql, params);
    const rows = result.rows || [];

    if (!rows.length) {
      return NextResponse.json(
        { error: "No hay datos para la fecha indicada" },
        { status: 404 }
      );
    }

    // Construcción de puntos + asignación de cluster (en ESCALA min-max)
    const points = rows.map((r: any) => {
      const x = P.feature_order.map((f) => Number(r[f]));
      const z = minMaxScale(x, P);
      const cl = assignClusterScaled(z, C);

      // objeto con las mismas 4 claves + cluster + timestamp
      const obj: any = { cluster: cl, timestamp: r.fecha_registro };
      P.feature_order.forEach((f, i) => (obj[f] = x[i]));
      return obj;
    });

    // Centroides en unidades originales con las MISMAS claves
    const centroids = C.map((c) => {
      const inv = minMaxInverse(c.values, P); // 4 valores en orden
      const obj: any = { cluster: c.cluster };
      P.feature_order.forEach((f, i) => (obj[f] = inv[i]));
      return obj;
    });

    return NextResponse.json(
      {
        date: dateParam ?? undefined,
        start: start ?? undefined,
        end: end ?? undefined,
        features: P.feature_order,
        points,
        centroids,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}

