import React from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const Home: React.FC = () => {
  return (
    <div className="container mt-5">
      {/* Section principale */}
      <header className="text-center mb-5">
        <h1 className="display-4 fw-bold">Bienvenue sur Nazek</h1>
        <p className="lead">Réservez facilement un rendez-vous avec nos experts qualifiés.</p>
        <Link to="/create" className="btn btn-primary btn-lg mt-3">
          Prendre un rendez-vous
        </Link>
      </header>

      {/* Section services */}
      <section className="row mt-5">
        <h2 className="text-center mb-4">Nos services</h2>

        <div className="col-md-4 text-center">
          <i className="fas fa-wrench fa-3x text-primary"></i>
          <h3 className="mt-3">Réparation</h3>
          <p>Des artisans qualifiés pour vos besoins de réparation.</p>
        </div>

        <div className="col-md-4 text-center">
          <i className="fas fa-bolt fa-3x text-warning"></i>
          <h3 className="mt-3">Électricité</h3>
          <p>Des interventions rapides et efficaces pour vos installations électriques.</p>
        </div>

        <div className="col-md-4 text-center">
          <i className="fas fa-tools fa-3x text-success"></i>
          <h3 className="mt-3">Plomberie</h3>
          <p>Réparation et installation de vos équipements de plomberie.</p>
        </div>
      </section>

      {/* Section témoignages */}
      <section className="mt-5">
        <h2 className="text-center mb-4">Avis de nos clients</h2>
        <div className="card mx-auto" style={{ maxWidth: '600px' }}>
          <div className="card-body">
            <blockquote className="blockquote mb-0">
              <p>« Service impeccable, je recommande vivement ! »</p>
              <footer className="blockquote-footer">Ines Oubabas</footer>
            </blockquote>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
