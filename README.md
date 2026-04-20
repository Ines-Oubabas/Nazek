# Nazek

Plateforme full-stack **Django + Django REST Framework + JWT + React (Vite)** pour la mise en relation **clients / prestataires** et la gestion de rendez-vous.

---

## Sommaire

- [Aperçu du projet](#aperçu-du-projet)
- [Fonctionnalités principales](#fonctionnalités-principales)
- [Stack technique](#stack-technique)
- [Architecture du dépôt](#architecture-du-dépôt)
- [Prérequis](#prérequis)
- [Installation et démarrage local](#installation-et-démarrage-local)
- [Variables d'environnement](#variables-denvironnement)
- [Authentification JWT](#authentification-jwt)
- [API principale](#api-principale)
- [Admin Django (Nazek Admin)](#admin-django-nazek-admin)
- [Tests et qualité](#tests-et-qualité)
- [Dépannage rapide](#dépannage-rapide)

---

## Aperçu du projet

Nazek permet de :

- créer des comptes **client** et **prestataire** ;
- publier des services ;
- consulter des prestataires ;
- réserver des rendez-vous ;
- gérer les paiements et notifications.

Le backend expose une API REST consommée par le frontend React.

---

## Fonctionnalités principales

### Côté backend (Django/DRF)

- Authentification JWT (register/login/logout).
- Gestion des utilisateurs et profils (`User`, `Client`, `Employer`).
- Gestion des services et disponibilités.
- Création et suivi des rendez-vous.
- Paiement (carte / espèces) et notifications.
- Interface d'administration Django customisée (**Nazek Admin**).

### Côté frontend (React/Vite)

- Parcours utilisateur : recherche, service detail, réservation.
- Espace client/prestataire.
- Navigation et affichage des données API.

---

## Stack technique

- **Backend** : Django 4.2, Django REST Framework, SimpleJWT
- **Frontend** : React + Vite
- **Base de données** : SQLite (par défaut en local)
- **Auth API** : JWT Bearer token

---

## Architecture du dépôt

```text
.
├── appointments/        # App Django principale (models, serializers, views, admin, tests)
├── nazek/               # Configuration Django (settings, urls, asgi/wsgi)
├── frontend/            # Application React (Vite)
├── manage.py
├── requirements.txt
└── README.md


Prérequis
Python 3.10+

Node.js 18+

npm

Installation et démarrage local
1) Backend
python -m venv venv
source venv/bin/activate      # Linux/macOS
# venv\Scripts\activate       # Windows PowerShell

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
Backend disponible sur : http://127.0.0.1:8000

2) Frontend
cd frontend
npm install
npm run dev
Frontend disponible (généralement) sur : http://127.0.0.1:3000 ou http://127.0.0.1:5173
(selon la configuration locale).

3) Build frontend (production)
cd frontend
npm run build
Variables d'environnement
Le backend lit les variables suivantes :

DJANGO_SECRET_KEY

DJANGO_DEBUG (True / False)

DJANGO_ALLOWED_HOSTS (ex: 127.0.0.1,localhost)

DJANGO_CORS_ALLOWED_ORIGINS (ex: http://localhost:3000,http://127.0.0.1:3000)

Exemple (Linux/macOS)
export DJANGO_SECRET_KEY="change-me"
export DJANGO_DEBUG="True"
export DJANGO_ALLOWED_HOSTS="127.0.0.1,localhost"
export DJANGO_CORS_ALLOWED_ORIGINS="http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173"
Authentification JWT
Flux standard :

POST /api/v1/auth/login/

récupérer access + refresh

envoyer Authorization: Bearer <access> sur les routes protégées

POST /api/v1/auth/logout/ avec le refresh pour blacklister

API principale
Préfixe global : /api/v1/

Auth
POST /api/v1/auth/register/

POST /api/v1/auth/login/

POST /api/v1/auth/logout/

GET /api/v1/auth/user/

Rendez-vous
GET /api/v1/appointments/

POST /api/v1/appointments/create/

GET|PUT|DELETE /api/v1/appointments/<id>/

POST /api/v1/appointments/<id>/review/

PUT /api/v1/appointments/<id>/add-review/

POST /api/v1/appointments/<id>/payment/

Notifications
GET /api/v1/notifications/

POST /api/v1/notifications/<id>/read/

Paiement
POST /api/v1/payments/<id>/process/

Admin Django (Nazek Admin)
URL : http://127.0.0.1:8000/admin/

L'admin est organisée pour faciliter les tests fonctionnels :

gestion des Clients / Prestataires / Disponibilités / Rendez-vous / Services / Utilisateurs ;

actions de masse utiles (activation, vérification, statuts rendez-vous, etc.) ;

filtres par statut, service, dates, paiement.

Ordre recommandé pour créer des données de test
Services

Utilisateurs

Prestataires

Clients

Disponibilités

Rendez-vous

Notifications

Tests et qualité
Tests app appointments
python manage.py test appointments -v 2
Tests endpoints critiques
python manage.py test appointments.tests.CriticalEndpointsTests -v 2
Check Django
python manage.py check
Dépannage rapide
Erreur 401/403 sur API
vérifier que le token Bearer est bien envoyé ;

vérifier que l'utilisateur a le bon rôle (client / employer) pour l'action.

Erreurs CORS en local
vérifier DJANGO_CORS_ALLOWED_ORIGINS ;

vérifier le port réel du frontend.

Erreur 400 lors de création de rendez-vous
vérifier que la date est future ;

vérifier que l'employeur est actif ;

vérifier la disponibilité sur le créneau demandé.