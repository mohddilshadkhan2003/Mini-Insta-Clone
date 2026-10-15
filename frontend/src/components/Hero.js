import React from 'react';
import './hero.css';
import BrandHeader from './BrandHeader';
import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <div className="landing-hero">
      <BrandHeader />
      <div className="hero-inner container">
        <div className="hero-copy">
          <h1 className="hero-title">Share moments. Discover stories.</h1>
          <p className="hero-sub">Mini Insta makes it simple to post photos, follow creators, and explore trending content. Built for speed, clarity, and delight.</p>

          <div className="hero-ctas">
            <Link to="/signup" className="btn btn-primary hero-cta">Get started</Link>
            <Link to="/login" className="btn btn-ghost hero-cta">Log in</Link>
          </div>

          <div className="hero-features">
            <div className="feature">Fast feed •</div>
            <div className="feature">Optimized backend •</div>
            <div className="feature">Responsive UI</div>
          </div>
        </div>

        <div className="hero-media" aria-hidden>
          <div className="phone-mockup">
            <div className="screen" />
            <div className="glow" />
          </div>
        </div>
      </div>
    </div>
  );
}
