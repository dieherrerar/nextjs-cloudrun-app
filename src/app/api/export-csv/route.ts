import { NextRequest } from "next/server";
import { query } from "../../lib/db";

function csvEscape(value: any): String {
  if (value == null || value == undefined) return "";
  const s = String(value);
  const escaped = s.replace(/"/g, '""');
  return /[",\r\n]/.test(s) ? `"${escaped}"` : escaped;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const dateParam = url.searchParams.get("date");
    const start = url.searchParams.get("start");
    const end = url.searchParams.get("end");

    // Construir y ejecutar consulta según exista dateParam o no
    let result;
    if (start && end) {
      result = await query(
        "SELECT * FROM datos_dispositivo WHERE CAST(fecha_registro AS date) BETWEEN $1 AND $2 ORDER BY fecha_registro ASC",
        [start, end]
      );
    } else if (dateParam) {
      result = await query(
        "SELECT * FROM datos_dispositivo WHERE CAST(fecha_registro AS date) = $1 ORDER BY fecha_registro ASC",
        [dateParam]
      );
    } else {
      result = await query(
        "SELECT * FROM datos_dispositivo ORDER BY fecha_registro ASC"
      );
    }

    const rows = result.rows || [];

    // Si no hay filas devolvemos JSON indicando que no hay datos
    if (!rows.length) {
      return new Response(JSON.stringify({ success: true, rows: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const headers = Object.keys(rows[0]); //cabecera del CSV

    // Construir CSV
    const csvLines: String[] = [];
    csvLines.push(headers.map(csvEscape).join(",")); // Cabecera

    for (const r of rows) {
      const line = headers.map((h) => csvEscape(r[h])).join(",");
      csvLines.push(line);
    }

    const csvContent = csvLines.join("\r\n");
    let dayTag: string;
    if (start && end) {
      dayTag = `_${start}_a_${end}`;
    } else if (dateParam) {
      dayTag = `_${dateParam}`;
    } else {
      dayTag = `_${new Date().toISOString().slice(0, 10)}`;
    }
    const filename = `datos_ambientales${dayTag}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
