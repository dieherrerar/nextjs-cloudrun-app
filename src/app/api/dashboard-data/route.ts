import type { NextRequest } from "next/server";
import { DashboardPayload } from "../../../../types/dashboard";
import { query } from "../../lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || undefined;
    const start = searchParams.get("start") || undefined;
    const end = searchParams.get("end") || undefined;

    // Determinar consulta por fecha única o rango
    let result;
    if (start && end) {
      result = await query(
        "SELECT * FROM datos_dispositivo WHERE fecha_registro::date BETWEEN $1 AND $2 ORDER BY fecha_registro ASC",
        [start, end]
      );
    } else {
      const effectiveDate = date || "2025-10-01";
      result = await query(
        "SELECT * FROM datos_dispositivo WHERE fecha_registro::date = $1 ORDER BY fecha_registro ASC",
        [effectiveDate]
      );
    }

    const rows = result.rows;

    if (!rows || rows.length === 0) {
      return new Response(JSON.stringify({ error: "No Data Found" }), {
        status: 404,
      });
    }

    // Helpers
    const round2 = (n: number) => Math.round(n * 100) / 100;
    const toNum = (v: any): number =>
      typeof v === "string" ? parseFloat(v) : (v as number);
    const isValid = (v: any): boolean => {
      const n = toNum(v);
      return n !== -999 && !Number.isNaN(n);
    };
    const avgOf = (key: string): number => {
      let sum = 0;
      let count = 0;
      for (const row of rows) {
        const raw = (row as any)?.[key];
        if (isValid(raw)) {
          sum += toNum(raw);
          count++;
        }
      }
      return count > 0 ? round2(sum / count) : -999;
    };
    const maxOf = (key: string): number => {
      let max: number | null = null;
      for (const row of rows) {
        const raw = (row as any)?.[key];
        if (isValid(raw)) {
          const n = toNum(raw);
          if (max === null || n > max) max = n;
        }
      }
      return max === null ? -999 : round2(max);
    };
    const sumOf = (key: string): number => {
      let sum = 0;
      let any = false;
      for (const row of rows) {
        const raw = (row as any)?.[key];
        if (isValid(raw)) {
          sum += toNum(raw);
          any = true;
        }
      }
      return any ? round2(sum) : -999;
    };

    const avgPM25 = avgOf("mp2.5_ate");
    const avgPM10 = avgOf("mp10_ate");
    const avgTemp = avgOf("tem_bme280");
    const maxCO2 = maxOf("co2_mhz19");
    const aguaCaida = sumOf("agua_caida");

    const totalConsumo = (() => {
      let sum = 0;
      let any = false;
      for (const row of rows) {
        const c1 = (row as any)["consumo_1"]; if (isValid(c1)) { sum += toNum(c1); any = true; }
        const c2 = (row as any)["consumo_2"]; if (isValid(c2)) { sum += toNum(c2); any = true; }
        const c3 = (row as any)["consumo_3"]; if (isValid(c3)) { sum += toNum(c3); any = true; }
      }
      return any ? round2(sum) : -999;
    })();

    const kpis = { avgPM25, avgPM10, avgTemp, maxCO2, aguaCaida };

    const timeseries = rows.map((row) => ({
      date: row.fecha_registro,
      pm25: round2(parseFloat(row["mp2.5_stp"] || "0")),
      temp: round2(parseFloat(row["tem_bme280"] || "0")),
      co2: round2(parseFloat(row["co2_mhz19"] || "0")),
    }));

    const totalMP = rows.reduce((acc, row) => {
      const v1 = (row as any)["mp1.0_ate"]; acc += isValid(v1) ? toNum(v1) : 0;
      const v2 = (row as any)["mp2.5_ate"]; acc += isValid(v2) ? toNum(v2) : 0;
      const v3 = (row as any)["mp10_ate"]; acc += isValid(v3) ? toNum(v3) : 0;
      return acc;
    }, 0);

    const composition = [
      {
        name: "mp1.0_ate",
        value: totalMP
          ? round2(
              (rows.reduce((acc, row) => {
                const v = (row as any)["mp1.0_ate"]; return acc + (isValid(v) ? toNum(v) : 0);
              }, 0) /
                totalMP) * 100
            )
          : 0,
      },
      {
        name: "mp2.5_ate",
        value: totalMP
          ? round2(
              (rows.reduce((acc, row) => {
                const v = (row as any)["mp2.5_ate"]; return acc + (isValid(v) ? toNum(v) : 0);
              }, 0) /
                totalMP) * 100
            )
          : 0,
      },
      {
        name: "mp10_ate",
        value: totalMP
          ? round2(
              (rows.reduce((acc, row) => {
                const v = (row as any)["mp10_ate"]; return acc + (isValid(v) ? toNum(v) : 0);
              }, 0) /
                totalMP) * 100
            )
          : 0,
      },
    ];

    // Consulta de bins por temperatura aplicada al mismo rango o fecha
    let tempBins;
    if (start && end) {
      tempBins = await query(
        `SELECT
            FLOOR(("tem_bme280")::numeric) AS temp_bin,
            AVG(("co2_mhz19")::numeric)    AS avg_co2,
            COUNT(*)                       AS n
          FROM datos_dispositivo
          WHERE fecha_registro::date BETWEEN $1 AND $2
            AND ("tem_bme280") IS NOT NULL
            AND ("co2_mhz19") IS NOT NULL
            AND ("tem_bme280")::numeric <> -999
            AND ("co2_mhz19")::numeric <> -999
          GROUP BY 1
          ORDER BY 1`,
        [start, end]
      );
    } else {
      const effectiveDate = date || "2025-10-01";
      tempBins = await query(
        `SELECT
            FLOOR(("tem_bme280")::numeric) AS temp_bin,
            AVG(("co2_mhz19")::numeric)    AS avg_co2,
            COUNT(*)                       AS n
          FROM datos_dispositivo
          WHERE fecha_registro::date = $1
            AND ("tem_bme280") IS NOT NULL
            AND ("co2_mhz19") IS NOT NULL
            AND ("tem_bme280")::numeric <> -999
            AND ("co2_mhz19")::numeric <> -999
          GROUP BY 1
          ORDER BY 1`,
        [effectiveDate]
      );
    }

    const tempRows = tempBins.rows;

    const tempCo2Trend = tempRows.map((t: any) => ({
      tempBin: Number(t.temp_bin),
      co2: round2(parseFloat(t.avg_co2 || "0")),
      count: Number(t.n),
    }));

    const stacked = timeseries.map((d) => ({
      date: d.date,
      co2: d.co2,
      consumo: round2(totalConsumo / timeseries.length),
    }));

    const payload: DashboardPayload = {
      kpis,
      timeseries,
      composition,
      stacked,
      tempCo2Trend,
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
    });
  }
}
