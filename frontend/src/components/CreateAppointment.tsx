import React, { useEffect, useState } from 'react';
import Spinner from 'react-bootstrap/Spinner';
import api from '../api';

interface Client {
  id: number;
  name: string;
}

interface Employer {
  id: number;
  name: string;
  service: string;
}

const CreateAppointment: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    client: '',
    employer: '',
    date: '',
    description: '',
    payment_method: 'carte',
    total_amount: 0,
  });

  // Charger la liste des clients et employeurs
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [clientsResponse, employersResponse] = await Promise.all([
          api.get<Client[]>('/clients/'),
          api.get<Employer[]>('/employers/'),
        ]);

        if (clientsResponse.data.length === 0 || employersResponse.data.length === 0) {
          setError('Aucun client ou employeur disponible.');
        } else {
          setClients(clientsResponse.data);
          setEmployers(employersResponse.data);
        }
      } catch (error) {
        setError('Erreur lors du chargement des données.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Gestion des changements dans le formulaire
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Gestion de la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await api.post('/appointments/create/', formData);
      setSuccessMessage('Rendez-vous créé avec succès ! 🎉');
      setFormData({
        client: '',
        employer: '',
        date: '',
        description: '',
        payment_method: 'carte',
        total_amount: 0,
      });
    } catch (error) {
      setError("Erreur lors de la création du rendez-vous. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Créer un Rendez-vous</h1>

      {error && <div className="alert alert-danger">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="client" className="form-label">Client</label>
          <select
            id="client"
            name="client"
            value={formData.client}
            onChange={handleChange}
            className="form-select"
            required
          >
            <option value="">Sélectionnez un client</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label htmlFor="employer" className="form-label">Employeur</label>
          <select
            id="employer"
            name="employer"
            value={formData.employer}
            onChange={handleChange}
            className="form-select"
            required
          >
            <option value="">Sélectionnez un employeur</option>
            {employers.map(employer => (
              <option key={employer.id} value={employer.id}>
                {employer.name} ({employer.service})
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label htmlFor="date" className="form-label">Date et heure</label>
          <input
            id="date"
            type="datetime-local"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="description" className="form-label">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="form-control"
          />
        </div>

        <div className="mb-3">
          <label htmlFor="payment_method" className="form-label">Mode de paiement</label>
          <select
            id="payment_method"
            name="payment_method"
            value={formData.payment_method}
            onChange={handleChange}
            className="form-select"
          >
            <option value="carte">Carte Dahabiya</option>
            <option value="especes">Espèces</option>
          </select>
        </div>

        <div className="mb-3">
          <label htmlFor="total_amount" className="form-label">Montant total</label>
          <input
            id="total_amount"
            type="number"
            name="total_amount"
            value={formData.total_amount}
            onChange={handleChange}
            className="form-control"
            required
            min="0"
          />
        </div>

        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
          {loading ? <Spinner animation="border" size="sm" /> : 'Créer le rendez-vous'}
        </button>
      </form>
    </div>
  );
};

export default CreateAppointment;
