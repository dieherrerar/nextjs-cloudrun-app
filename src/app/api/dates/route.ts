import { query } from "../../lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await query(
      "SELECT DISTINCT CAST(fecha_registro AS DATE) AS fecha FROM datos_dispositivo ORDER BY fecha ASC;"
    );

    const dates = result.rows.map((row) => row.fecha);

    return NextResponse.json({ success: true, dates });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMessage });
  }
}
