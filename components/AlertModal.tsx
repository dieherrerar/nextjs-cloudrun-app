export type AlertRow = {
  id_alerta: number;
  id_dato_dispositivo: number;
  title: string;
  message: string;
  value?: number | string; // <-- acepta ambos
  variable?: string;
  level: "info" | "warning" | "critical";
  ts?: string;
  // Campos opcionales desde detalle_alerta
  detalle_tipo_alerta?: string;
  detalle_fecha_hora_alerta?: string;
  detalle_valor_anomalo?: string | number;
  detalle_columnas_afectadas?: string;
};

export default function AlertModal({
  open,
  alert,
  onClose,
}: {
  open: boolean;
  alert: AlertRow | null;
  onClose: () => void;
}) {
  if (!open || !alert) return null;

  const theme = (() => {
    if (alert.level === "critical") {
      return {
        headerBg: "#F8D7DA",
        headerText: "#842029",
        border: "#F5C2C7",
        icon: "!",
        label: "Alerta Critica",
      } as const;
    }
    if (alert.level === "warning") {
      return {
        headerBg: "#FFF3CD",
        headerText: "#664D03",
        border: "#FFEEBA",
        icon: "!",
        label: "Advertencia",
      } as const;
    }
    return {
      headerBg: "#E1F0FF",
      headerText: "#084298",
      border: "#B6DAFF",
      icon: "i",
      label: "Informacion",
    } as const;
  })();

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center", // centrado vertical
        zIndex: 9998,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          borderRadius: 14, // igual a dashboard
          background: "#fff",
          // sombra suave similar al dashboard
          boxShadow: "0 4px 18px rgba(30, 80, 60, 0.1)",
          zIndex: 9999,
          border: "1px solid rgba(30, 80, 60, 0.18)",
          overflow: "hidden",
          fontFamily: 'Inter, "Segoe UI", Arial, sans-serif',
          color: "#184d2b",
        }}
      >
        <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <div
            // franja indicadora del tipo a la izquierda
            style={{
              width: 6,
              alignSelf: "stretch",
              borderRadius: 4,
              background:
                alert.level === "critical"
                  ? "#f03e3e"
                  : alert.level === "warning"
                  ? "#f59f00"
                  : "#1e90ff",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
            <span aria-hidden style={{ fontSize: 18 }}>{theme.icon}</span>
            <span style={{ fontSize: 14 }}>{theme.label}</span>
          </div>
        </div>

        <div style={{ padding: 16 }}>
          <h3 style={{ margin: 0, marginBottom: 8, fontSize: 18, fontWeight: 700, color: "#184d2b" }}>
            {alert.title}
          </h3>
          <p style={{ margin: 0, marginBottom: 8, fontSize: 14 }}>{alert.message}</p>

          {alert.value !== undefined && alert.value !== null && (
            <p style={{ margin: 0, marginBottom: 8, fontSize: 12, color: "#475569" }}>
              {alert.variable}: <b>{String(alert.value)}</b>
              {alert.ts ? ` - ${alert.ts}` : ""}
            </p>
          )}

          {(alert.detalle_tipo_alerta ||
            alert.detalle_fecha_hora_alerta ||
            alert.detalle_valor_anomalo !== undefined ||
            alert.detalle_columnas_afectadas) && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #e5e7eb", fontSize: 12, color: "#334155" }}>
              {alert.detalle_tipo_alerta && (
                <p style={{ margin: 0, marginBottom: 4 }}>
                  Tipo de alerta: <b>{alert.detalle_tipo_alerta}</b>
                </p>
              )}
              {alert.detalle_fecha_hora_alerta && (
                <p style={{ margin: 0, marginBottom: 4 }}>
                  Fecha/Hora: <b>{alert.detalle_fecha_hora_alerta}</b>
                </p>
              )}
              {typeof alert.detalle_valor_anomalo !== "undefined" && alert.detalle_valor_anomalo !== null && (
                <p style={{ margin: 0, marginBottom: 4 }}>
                  Valor anomalo: <b>{String(alert.detalle_valor_anomalo)}</b>
                </p>
              )}
              {alert.detalle_columnas_afectadas && (
                <p style={{ margin: 0 }}>
                  Columnas afectadas: <b>{alert.detalle_columnas_afectadas}</b>
                </p>
              )}
            </div>
          )}

          <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button onClick={onClose} className="dashboard-btn-blue">Aceptar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
