import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="container text-center mt-5">
      <h1 className="display-3 text-danger">404</h1>
      <h2 className="mt-3">Page introuvable</h2>
      <p className="lead">
        Oups ! La page que vous recherchez n'existe pas.
      </p>
      <Link to="/" className="btn btn-primary mt-3">
        Retour à l'accueil
      </Link>
    </div>
  );
};

export default NotFound;
