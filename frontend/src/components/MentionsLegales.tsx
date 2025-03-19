import React from 'react';

const MentionsLegales: React.FC = () => {
  return (
    <div className="container mt-5">
      <h1 className="text-center">Mentions Légales</h1>
      <p>Ce site web est édité par <strong>Nazek</strong>.</p>

      <h2>Éditeur du site</h2>
      <p><strong>Nom de l'entreprise :</strong> Nazek</p>
      <p><strong>Adresse :</strong> 123, Rue Exemple, Alger, Algérie</p>
      <p><strong>Email :</strong> contact@nazek.com</p>
      <p><strong>Numéro de téléphone :</strong> +213 123 456 789</p>

      <h2>Hébergement</h2>
      <p>Ce site est hébergé par [Nom de l'hébergeur] – [Adresse] – [Contact]</p>

      <h2>Propriété intellectuelle</h2>
      <p>Tout le contenu présent sur ce site (textes, images, logo) est protégé par le droit d’auteur.</p>

      <h2>Conditions d’utilisation</h2>
      <p>En utilisant ce site, vous acceptez les conditions générales d’utilisation.</p>

      <p className="mt-4">Dernière mise à jour : {new Date().toLocaleDateString()}</p>
    </div>
  );
};

export default MentionsLegales;
