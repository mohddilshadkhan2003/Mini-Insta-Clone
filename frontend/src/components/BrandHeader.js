import React from "react";
import { Link } from "react-router-dom";
import './brand.css';

export default function BrandHeader({ compact }) {
  return (
    <header className={`brand-header ${compact ? 'compact' : ''}`}>
      <div className="brand-left">
        <Link to="/" className="brand-logo-link">
          <img src="/logo.svg" alt="Mini Insta Clone" className="brand-logo" />
          <span className="brand-title">Mini Insta</span>
        </Link>
      </div>

      <nav className="brand-actions">
        <Link to="/explore" className="nav-link">Explore</Link>
        <Link to="/login" className="btn btn-ghost">Log in</Link>
        <Link to="/signup" className="btn btn-primary">Sign up</Link>
      </nav>
    </header>
  );
}
