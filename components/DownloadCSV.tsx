"use client";

import React from "react";

interface DownloadButtonProps {
  label: String;
  date?: String; // compat
  start?: String;
  end?: String;
}

export default function DownloadButton(props: DownloadButtonProps) {
  const { label, date, start, end } = props;
  const handleDownload = async () => {
    try {
      let url = "/api/export-csv";
      if (start && end) {
        const params = new URLSearchParams({ start: String(start), end: String(end) });
        url = `/api/export-csv?${params.toString()}`;
      } else if (date) {
        url = `/api/export-csv?date=${date}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Error en la descarga del archivo");
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = downloadUrl;
      const suffix = start && end ? `_${start}_a_${end}` : (date ? `_${date}` : "");
      a.download = `datos_ambientales${suffix}.csv`;

      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <button className="dashboard-btn" onClick={handleDownload}>
      {label}
    </button>
  );
}
