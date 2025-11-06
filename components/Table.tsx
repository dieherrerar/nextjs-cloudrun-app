"use client";

import React from "react";

interface TableProps {
  datos: {
    variable: String;
    descripcion: String;
    rango: String;
  }[];
}

export default function Table(props: TableProps) {
  const { datos } = props;
  return (
    <div className="table-container">
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Variable</th>
            <th>Descripción</th>
            <th>Rango Observado</th>
          </tr>
        </thead>
        <tbody>
          {datos.map((row, index) => (
            <tr key={index}>
              <td>{row.variable}</td>
              <td>{row.descripcion}</td>
              <td>{row.rango}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
