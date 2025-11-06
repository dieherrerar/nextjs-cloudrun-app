import { NextResponse } from "next/server";
import { query } from "../../../lib/db";
import bcrypt from "bcryptjs";
import { signAuthToken, authCookieOptions } from "../../../lib/auth";
import { sign } from "crypto";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    const r = await query(
      `SELECT id_usuario, nombre_usuario, correo_usuario, contrasena_usuario, id_tipo_usuario
            FROM usuario
            WHERE correo_usuario = $1
            LIMIT 1`,
      [email]
    );

    if (!r.rows.length) {
      return NextResponse.json(
        { error: "Credenciales inváilidas" },
        { status: 401 }
      );
    }

    const u = r.rows[0];
    const ok = await bcrypt.compare(password, u.contrasena_usuario);
    if (!ok) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    if (Number(u.id_tipo_usuario) !== 1) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const token = await signAuthToken({
      name: u.nombre_usuario,
      sub: String(u.id_usuario),
      email: u.correo_usuario,
      role: "admin",
    });

    const res = NextResponse.json({ success: true });
    const { name, cookie } = authCookieOptions();
    res.cookies.set(name, token, cookie);
    return res;
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Error en el servidor" },
      { status: 500 }
    );
  }
}
