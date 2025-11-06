"use client";
import React from "react";

export default function FullPageLoader({
  message = "Cargando...",
}: {
  message?: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
        flexDirection: "column",
      }}
    >
      <div className="spinner-ecopulse" />
      <div
        style={{
          fontSize: "2rem",
          fontWeight: "bold",
          color: "#1e90ff",
          marginTop: "2rem",
          textAlign: "center",
          letterSpacing: "1px",
          textShadow: "0 2px 8px rgba(30,144,255,0.10)",
        }}
      >
        {message}
      </div>
    </div>
  );
}
