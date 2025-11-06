"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function Admin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErr(j?.error || "Credenciales inváilidas");
        return;
      }
      setTimeout(() => {
        window.location.assign("/home");
      }, 0);
    } catch (e: any) {
      setErr(e?.message || "Error realizando login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="login-admin-bg"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #9dbb9e 0%, #1d6d1b 100%)",
      }}
    >
      <form
        className="login-admin-form"
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 4px 32px rgba(30,80,60,0.10)",
          padding: 32,
          minWidth: 320,
          maxWidth: 380,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <h2 style={{ textAlign: "center", color: "#1d6d1b", marginBottom: 12 }}>
          Login Administrador
        </h2>
        <label style={{ color: "#184d2b", fontWeight: 500 }}>
          Correo electrónico
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="form-control"
            style={{ marginTop: 4 }}
            placeholder="correo@ejemplo.com"
          />
        </label>
        <label style={{ color: "#184d2b", fontWeight: 500 }}>
          Contraseña
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            className="form-control"
            style={{ marginTop: 4 }}
            placeholder="********"
          />
        </label>
        {err && (
          <div className="text-danger" style={{ fontWeight: 600 }}>
            {err}
          </div>
        )}
        <button
          type="submit"
          className="btn btn-success"
          disabled={loading}
          style={{ marginTop: 12, fontWeight: 600, letterSpacing: 1 }}
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
