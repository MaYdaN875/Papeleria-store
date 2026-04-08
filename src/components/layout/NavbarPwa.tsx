import React from "react";
import { Link } from "react-router";
import { SearchBar } from "./SearchBar";
import { useStoreNavActions } from "../../hooks/useStoreNavActions"; // si existe, si no, lo manejamos directo
import "./NavbarPwa.css";
import { products as staticProducts } from "../../data/products";

interface NavbarPwaProps {
  onToggleMenu: () => void;
}

export function NavbarPwa({ onToggleMenu }: NavbarPwaProps) {
  // En tu diseño original, este header está directamente pegado arriba y su searchBox abarca todo el centro
  return (
    <header className="pwa-header-legacy">
      <div className="pwa-header-legacy__container">
        
        {/* LOGO */}
        <Link to="/" className="pwa-header-legacy__logo">
          <img src="/logo.png" alt="God Art" />
        </Link>

        {/* SEARCH BAR CENTRAL (Siempre Expandido como en la Foto) */}
        <div className="pwa-header-legacy__search">
          <SearchBar placeholder="Buscar productos..." products={staticProducts} />
        </div>

        {/* HAMBURGUESA DERECHA (Oscura) */}
        <button 
          className="pwa-header-legacy__btn" 
          onClick={onToggleMenu}
          aria-label="Menú"
        >
          <i className="fas fa-bars"></i>
        </button>

      </div>
    </header>
  );
}
