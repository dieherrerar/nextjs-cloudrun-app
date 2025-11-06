"use client";

import { useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./estilos_componentes.css";
import React from "react";

interface AccordionProps {
  title: string;
  description: string;
  imageUrl?: string;
}

export default function Accordion({ title, description }: AccordionProps) {
  // Cargar Bootstrap JS solo en el cliente
  useEffect(() => {
    import("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, []);

  return (
    <div className="card" style={{ width: "18rem", height: "15rem" }}>
      <div className="card-body">
        <h5 className="card-title">{title}</h5>
        <p className="card-text">{description}</p>
      </div>
    </div>
  );
}
