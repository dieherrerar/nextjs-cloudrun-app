"use client";
import React from "react";

interface GraficoItem {
  id_grafico: number;
  titulo_grafico: string;
  activo: number;
}

interface AdminChartPickerProps {
  title: string;
  graficos: GraficoItem[];
  onToggleGrafico: (id_grafico: number) => void;
  onSave: () => void;
  onCancel: () => void;
  hasChanges?: boolean;
  saving?: boolean;
}

export default function AdminChartPicker(props: AdminChartPickerProps) {
  const {
    title,
    graficos,
    onToggleGrafico,
    onSave,
    onCancel,
    hasChanges = false,
    saving = false,
  } = props;
  return (
    <>
      <h5 className="mb-3 d-none d-lg-block">{title}</h5>
      <ul className="list-group">
        {/* LISTADO DINAMICO DE LOS GRAFICOS*/}
        {graficos.map((grafico) => (
          <li className="list-group-item" key={String(grafico.id_grafico)}>
            <div className="form-check">
              <input
                className="form-check-input me-2"
                type="checkbox"
                id={`grafico-${grafico.id_grafico}`}
                checked={grafico.activo === 1}
                onChange={() => onToggleGrafico(Number(grafico.id_grafico))}
              />
              <label
                className="form-check-label small text-muted"
                htmlFor={`grafico-${grafico.id_grafico}`}
              >
                {grafico.titulo_grafico}
              </label>
            </div>
          </li>
        ))}

        {/* BOTON DE GUARDAR/CANCELAR */}
        <li className="list-group-item d-flex gap-2 justify-content-end">
          <button
            className="btn btn-sm dashboard-btn-cancel"
            type="button"
            onClick={onCancel}
            disabled={!hasChanges || saving}
          >
            Cancelar
          </button>
          <button
            className="btn btn-sm dashboard-btn-save"
            type="button"
            onClick={onSave}
            disabled={!hasChanges || saving}
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </li>
        {hasChanges && !saving && (
          <li className="list-group-item small text-muted save-hint">
            Tienes cambios sin guardar
          </li>
        )}
      </ul>
    </>
  );
}
