import React, { useEffect, useState } from 'react';
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
  const [formData, setFormData] = useState({
    client: '',
    employer: '',
    date: '',
    description: '',
    payment_method: 'carte',
    total_amount: 0,
  });

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await api.get<Client[]>('/clients/');
        setClients(response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des clients :', error);
        setError('Impossible de charger les clients.');
      }
    };

    const fetchEmployers = async () => {
      try {
        const response = await api.get<Employer[]>('/employers/');
        setEmployers(response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des employeurs :', error);
        setError('Impossible de charger les employeurs.');
      }
    };

    fetchClients();
    fetchEmployers();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/appointments/create/', formData);
      alert('Rendez-vous créé avec succès : ' + JSON.stringify(response.data));
      setError(null);
    } catch (error) {
      console.error('Erreur lors de la création du rendez-vous :', error);
      setError('Erreur lors de la création du rendez-vous.');
    }
  };

  return (
    <div>
      <h1>Créer un Rendez-vous</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <label>
          Client :
          <select
            name="client"
            value={formData.client}
            onChange={handleChange}
            required
          >
            <option value="">Sélectionnez un client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Employeur :
          <select
            name="employer"
            value={formData.employer}
            onChange={handleChange}
            required
          >
            <option value="">Sélectionnez un employeur</option>
            {employers.map((employer) => (
              <option key={employer.id} value={employer.id}>
                {employer.name} ({employer.service})
              </option>
            ))}
          </select>
        </label>
        <label>
          Date et heure :
          <input
            type="datetime-local"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Description :
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
          />
        </label>
        <label>
          Mode de paiement :
          <select
            name="payment_method"
            value={formData.payment_method}
            onChange={handleChange}
          >
            <option value="carte">Carte Dahabiya</option>
            <option value="especes">Espèces</option>
          </select>
        </label>
        <label>
          Montant total :
          <input
            type="number"
            name="total_amount"
            value={formData.total_amount}
            onChange={handleChange}
          />
        </label>
        <button type="submit">Créer le rendez-vous</button>
      </form>
    </div>
  );
};

export default CreateAppointment;
