import React from 'react';
import Hero from '../components/Hero';

export default function Landing() {
  return (
    <main>
      <Hero />
      <section className="container" style={{paddingTop: 18}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:16}}>
          <article className="card">
            <div style={{padding:18}}>
              <h3 style={{marginTop:0}}>Beautiful UI</h3>
              <p style={{color:'var(--muted)'}}>Cards, gradients, and soft shadows make the feeds easy on the eyes.</p>
            </div>
          </article>

          <article className="card">
            <div style={{padding:18}}>
              <h3 style={{marginTop:0}}>Fast Backend</h3>
              <p style={{color:'var(--muted)'}}>SQLite with indexing keeps the feed snappy for demos and prototypes.</p>
            </div>
          </article>

          <article className="card">
            <div style={{padding:18}}>
              <h3 style={{marginTop:0}}>Easy to Extend</h3>
              <p style={{color:'var(--muted)'}}>Well-structured codebase so you can add features like stories and messaging.</p>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
