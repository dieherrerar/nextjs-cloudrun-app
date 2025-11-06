"use client";

import "bootstrap/dist/css/bootstrap.min.css";
import "./estilos_componentes.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { color } from "framer-motion";

export default function Navbar() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/validate", { cache: "no-store" });
        const j = await res.json();
        setIsAdmin(j?.valid === true);
      } catch {
        setIsAdmin(false);
      }
    }
    checkAuth();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsAdmin(false);
    router.push("/admin");
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        <Link
          className="navbar-brand d-flex align-items-center gap-2"
          href="/home"
        >
          <img
            src="/images/151-1514784_hojas-de-arbol-png-folhas-de-arvores-png-removebg-preview.png"
            alt="EcoPulse logo"
            style={{
              height: 36,
              width: 36,
              marginRight: 8,
              objectFit: "contain",
            }}
          />
          EcoPulse
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link active" href="/dashboard">
                Dashboard
              </Link>
            </li>
            <li className="nav-item dropdown">
              <Link className="nav-link active" href="/alertas">
                Alertas
              </Link>
            </li>
            <li className="nav-item dropdown">
              <Link className="nav-link active" href="/clustering">
                Patrones
              </Link>
            </li>
            {isAdmin && (
              <li className="nav-item dropdown">
                <Link
                  className="nav-link active logout-link"
                  onClick={handleLogout}
                  href="#"
                  style={{ color: "red" }}
                >
                  Logout
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
