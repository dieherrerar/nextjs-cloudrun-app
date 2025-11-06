"use client";

import React, { useEffect, useState } from "react";
import KpiCard from "./KpiCard";

interface TemperatureCardProps {
  city: string;
}

export default function TemperatureCard({ city }: TemperatureCardProps) {
  const [temp, setTemp] = useState<string>("N/A");

  useEffect(() => {
    const fetchTemp = async () => {
      try {
        let endpoint = "";
        switch (city) {
          case "Viña del Mar":
            endpoint = "/api/temperatura/vina";
            break;
          case "Valparaíso":
            endpoint = "/api/temperatura/valparaiso";
            break;
          case "Punta Arenas":
            endpoint = "/api/temperatura/punta-arenas";
            break;
        }

        const r = await fetch(endpoint, {
          cache: "no-store",
        });
        const j = await r.json();
        if (j?.temperatura !== null && j?.temperatura !== undefined) {
          setTemp(`${j.temperatura} °C`);
        }
      } catch {
        setTemp("N/A");
      }
    };

    fetchTemp();
    // Actualizar cada 5 minutos
    const interval = setInterval(fetchTemp, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [city]);

  return <KpiCard title={city} value={temp} subtitle="Temperatura actual" />;
}
