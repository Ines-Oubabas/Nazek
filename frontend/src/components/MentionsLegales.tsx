import React from 'react';

const MentionsLegales: React.FC = () => {
  const today = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="container mt-5 mb-5">
      <h1 className="text-center mb-4">Mentions Légales</h1>

      <section className="mb-4">
        <h2>Éditeur du site</h2>
        <p><strong>Nom de l'entreprise :</strong> Nazek</p>
        <address>
          <p><strong>Adresse :</strong> 123, Rue Exemple, Alger, Algérie</p>
          <p><strong>Email :</strong> <a href="mailto:contact@nazek.com">contact@nazek.com</a></p>
          <p><strong>Téléphone :</strong> <a href="tel:+213123456789">+213 123 456 789</a></p>
        </address>
      </section>

      <section className="mb-4">
        <h2>Hébergement</h2>
        <p>Ce site est hébergé par <strong>[Nom de l'hébergeur]</strong> – [Adresse complète] – [Contact]</p>
      </section>

      <section className="mb-4">
        <h2>Propriété intellectuelle</h2>
        <p>Tous les éléments présents sur ce site (textes, images, logos, etc.) sont la propriété de Nazek ou de ses partenaires, et sont protégés par les lois relatives à la propriété intellectuelle.</p>
      </section>

      <section className="mb-4">
        <h2>Conditions d’utilisation</h2>
        <p>En accédant à ce site, vous acceptez les présentes conditions générales d’utilisation. Celles-ci peuvent être modifiées à tout moment sans préavis.</p>
      </section>

      <p className="text-muted mt-5">Dernière mise à jour : {today}</p>
    </div>
  );
};

export default MentionsLegales;
