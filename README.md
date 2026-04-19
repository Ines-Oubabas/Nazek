
# Nazek App

Application full-stack **Django + DRF + JWT + React (Vite)** pour la gestion de rendez-vous entre clients et prestataires.

---

## Stack technique

- **Backend**: Django 4.2, Django REST Framework, SimpleJWT
- **Frontend**: React + Vite
- **Base de données**: SQLite (par défaut en local)

---

## Arborescence

- `nazek/` : configuration Django
- `appointments/` : app principale (modèles, vues API, routes, tests)
- `frontend/` : application React

---

## Prérequis

- Python 3.10+
- Node.js 18+
- npm

---

## Installation backend (Django)

```bash
python -m venv venv
source venv/bin/activate   # Linux/macOS
# ou
venv\Scripts\activate      # Windows

pip install -r requirements.txt
python manage.py migrate
Lancer le backend :

python manage.py runserver
Backend disponible sur : http://127.0.0.1:8000

Variables d’environnement (backend)
Le projet lit ces variables :

DJANGO_SECRET_KEY

DJANGO_DEBUG (True/False)

DJANGO_ALLOWED_HOSTS (ex: 127.0.0.1,localhost)

DJANGO_CORS_ALLOWED_ORIGINS (ex: http://localhost:5173,http://127.0.0.1:5173)

Exemple (Linux/macOS) :

export DJANGO_SECRET_KEY="change-me"
export DJANGO_DEBUG="True"
export DJANGO_ALLOWED_HOSTS="127.0.0.1,localhost"
export DJANGO_CORS_ALLOWED_ORIGINS="http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173"
Installation frontend (React)
cd frontend
npm install
npm run dev
Frontend disponible généralement sur : http://127.0.0.1:5173

Build production frontend :

npm run build
Endpoints API principaux
Préfixe API : /api/v1/

Auth
POST /api/v1/auth/register/

POST /api/v1/auth/login/

POST /api/v1/auth/logout/

GET /api/v1/auth/user/

Appointments
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

Tests
Lancer les tests critiques des endpoints :

python manage.py test appointments.tests.CriticalEndpointsTests -v 2
Lancer toute la suite :

python manage.py test -v 2
Vérification rapide
python manage.py check
cd frontend && npm run build
Notes
En local, l’auth utilise JWT Bearer token.

Les routes avec <id> attendent des IDs numériques réels.

Le projet inclut des tests API pour les endpoints critiques corrigés.