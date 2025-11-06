"use client";
import { useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./estilos_componentes.css";
import Link from "next/link";

export default function Carousel() {
  useEffect(() => {
    // Importar Bootstrap JS solo en el cliente
    import("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, []);

  return (
    <div
      id="carouselExampleCaptions"
      className="carousel slide"
      data-bs-ride="carousel"
      data-bs-interval="5000"
    >
      <div className="carousel-indicators">
        <button
          type="button"
          data-bs-target="#carouselExampleCaptions"
          data-bs-slide-to="0"
          className="active"
          aria-current="true"
          aria-label="Slide 1"
        ></button>
        <button
          type="button"
          data-bs-target="#carouselExampleCaptions"
          data-bs-slide-to="1"
          aria-label="Slide 2"
        ></button>
        <button
          type="button"
          data-bs-target="#carouselExampleCaptions"
          data-bs-slide-to="2"
          aria-label="Slide 3"
        ></button>
      </div>
      <div className="carousel-inner">
        <div className="carousel-item active" style={{ position: "relative" }}>
          <img
            src="/images/45.jpg"
            className="d-block w-100 h-100"
            alt="EcoPulse"
          />
          <div className="carousel-img-overlay"></div>
          <div className="carousel-caption carousel-caption-center">
            <h1 className="ecopulse-title mb-3">
              <Link className="navbar-brand" href="/home">
                EcoPulse
              </Link>
            </h1>
            <h5 className="ecopulse-subtitle">
              Monitoreo, patrones y alertas medioambientales
            </h5>
          </div>
        </div>
        <div className="carousel-item" style={{ position: "relative" }}>
          <img
            src="/images/lena-2.jpg"
            className="d-block w-100 h-100"
            alt="Alertas"
          />
          <div className="carousel-img-overlay"></div>
          <div className="carousel-caption carousel-caption-center">
            <h1 className="ecopulse-title mb-3">
              <Link className="navbar-brand" href="/alertas">
                Alertas
              </Link>
            </h1>
            <h5 className="ecopulse-subtitle">
              Descubre las alertas medioambientales emitidas.
            </h5>
          </div>
        </div>
        <div className="carousel-item" style={{ position: "relative" }}>
          <img
            src="/images/dashboard.jpg"
            className="d-block w-100 h-100"
            alt="Dashboard"
          />
          <div className="carousel-img-overlay"></div>
          <div className="carousel-caption carousel-caption-center">
            <h1 className="ecopulse-title mb-3">
              <Link className="navbar-brand" href="/dashboard">
                Dashboard
              </Link>
            </h1>
            <h5 className="ecopulse-subtitle">
              Revisa y analiza datos medioambientales en tiempo real.
            </h5>
          </div>
        </div>
      </div>
      <button
        className="carousel-control-prev"
        type="button"
        data-bs-target="#carouselExampleCaptions"
        data-bs-slide="prev"
      >
        <span className="carousel-control-prev-icon" aria-hidden="true"></span>
        <span className="visually-hidden">Previous</span>
      </button>
      <button
        className="carousel-control-next"
        type="button"
        data-bs-target="#carouselExampleCaptions"
        data-bs-slide="next"
      >
        <span className="carousel-control-next-icon" aria-hidden="true"></span>
        <span className="visually-hidden">Next</span>
      </button>
    </div>
  );
}
