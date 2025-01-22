import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div>
      <h1>Bienvenue dans l'application de gestion des rendez-vous</h1>
      <Link to="/create">Créer un rendez-vous</Link>
      <br />
      <Link to="/list">Voir tous les rendez-vous</Link>
    </div>
  );
};

export default Home;
