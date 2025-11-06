import { query } from "../../lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await query("SELECT * FROM diccionario_dato;");

    const datos = result.rows.map((row) => ({
      variable: row.nombre_variable,
      descripcion: row.descripcion_variable,
      rango: row.rango_variable,
    }));

    return NextResponse.json({ success: true, datos });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMessage });
  }
}
