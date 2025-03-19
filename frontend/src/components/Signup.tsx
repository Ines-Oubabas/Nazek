import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Signup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'client' | 'employer'>('client');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.post('/auth/register/', { username: name, email, password, role }); // 🔹 Correction ici
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.error || "Erreur lors de l'inscription. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center">Créer un compte</h2>
      <form onSubmit={handleSubmit} className="card p-4 mx-auto shadow" style={{ maxWidth: '400px' }}>
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="mb-3">
          <label className="form-label">Nom</label>
          <input
            type="text"
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Mot de passe</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Rôle</label>
          <select className="form-control" value={role} onChange={(e) => setRole(e.target.value as 'client' | 'employer')}>
            <option value="client">Client</option>
            <option value="employer">Employeur</option>
          </select>
        </div>

        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
          {loading ? "Création..." : "S'inscrire"}
        </button>
      </form>
    </div>
  );
};

export default Signup;
