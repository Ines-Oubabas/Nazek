import React, { useState } from 'react';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Message envoyé avec succès !');
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <div className="container mt-5">
      <h1 className="text-center">Contactez-nous</h1>
      <p className="text-center">Remplissez le formulaire ci-dessous et nous vous répondrons dès que possible.</p>

      <form onSubmit={handleSubmit} className="mx-auto" style={{ maxWidth: '600px' }}>
        <div className="mb-3">
          <label htmlFor="name" className="form-label">Nom</label>
          <input type="text" id="name" name="name" className="form-control" value={formData.name} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email</label>
          <input type="email" id="email" name="email" className="form-control" value={formData.email} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label htmlFor="message" className="form-label">Message</label>
          <textarea id="message" name="message" className="form-control" rows={4} value={formData.message} onChange={handleChange} required />
        </div>
        <button type="submit" className="btn btn-primary w-100">Envoyer</button>
      </form>
    </div>
  );
};

export default Contact;
