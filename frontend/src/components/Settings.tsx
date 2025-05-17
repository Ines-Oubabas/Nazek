import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserLock,
  faBell,
  faLanguage,
  faPalette,
  faSave,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import { userAPI } from '@/services/api'; // ✅ Correction ici
import { User } from '@/types'; // ✅ Correction ici

interface Settings {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  language: string;
  theme: string;
  privacy: {
    showProfile: boolean;
    showEmail: boolean;
    showPhone: boolean;
  };
}

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [settings, setSettings] = useState<Settings>({
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    language: 'fr',
    theme: 'light',
    privacy: {
      showProfile: true,
      showEmail: true,
      showPhone: false
    }
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await userAPI.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      setSuccessMessage('Mot de passe modifié avec succès');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await userAPI.updateProfile(settings); // ✅ Modification ici
      setSuccessMessage('Paramètres mis à jour avec succès');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la mise à jour des paramètres');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      {/* ... tout le reste de ton code reste inchangé ... */}
    </div>
  );
};

export default Settings;
