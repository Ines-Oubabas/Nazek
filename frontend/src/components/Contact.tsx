import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Button, Form, Spinner, Alert } from 'react-bootstrap';

// Schéma de validation avec Yup
const schema = yup.object().shape({
  name: yup.string().required('Le nom est obligatoire'),
  email: yup.string().email('Email invalide').required('L\'email est obligatoire'),
  message: yup.string().required('Le message ne peut pas être vide')
});

const Contact: React.FC = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema) // Intégration de Yup pour la validation
  });

  const onSubmit = (data: any) => {
    // Ici tu gères l'envoi des données du formulaire
    alert('Message envoyé avec succès !');
    console.log(data); // Affiche les données dans la console
  };

  return (
    <div className="container mt-5">
      <h1 className="text-center">Contactez-nous</h1>
      <p className="text-center">Remplissez le formulaire ci-dessous et nous vous répondrons dès que possible.</p>

      <Form onSubmit={handleSubmit(onSubmit)} className="mx-auto" style={{ maxWidth: '600px' }}>
        <div className="mb-3">
          <Form.Label htmlFor="name">Nom</Form.Label>
          <Form.Control
            type="text"
            id="name"
            {...register('name')} // Enregistrement du champ
            isInvalid={!!errors.name} // Afficher l'erreur si elle existe
          />
          <Form.Control.Feedback type="invalid">
            {errors.name?.message}
          </Form.Control.Feedback>
        </div>

        <div className="mb-3">
          <Form.Label htmlFor="email">Email</Form.Label>
          <Form.Control
            type="email"
            id="email"
            {...register('email')}
            isInvalid={!!errors.email}
          />
          <Form.Control.Feedback type="invalid">
            {errors.email?.message}
          </Form.Control.Feedback>
        </div>

        <div className="mb-3">
          <Form.Label htmlFor="message">Message</Form.Label>
          <Form.Control
            as="textarea"
            id="message"
            {...register('message')}
            rows={4}
            isInvalid={!!errors.message}
          />
          <Form.Control.Feedback type="invalid">
            {errors.message?.message}
          </Form.Control.Feedback>
        </div>

        <Button type="submit" className="w-100" disabled={isSubmitting}>
          {isSubmitting ? <Spinner animation="border" size="sm" /> : 'Envoyer'}
        </Button>
      </Form>
    </div>
  );
};

export default Contact;
