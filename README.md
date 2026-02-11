# 🃏 Pokemon Card Inventory Tracker

A full-stack web application for tracking Pokemon card inventory, designed to eventually become a marketplace. Built with modern technologies and best practices for scalability and maintainability.

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Clone the Repository](#1-clone-the-repository)
  - [Backend Setup](#2-backend-setup)
  - [Frontend Setup](#3-frontend-setup)
  - [AWS S3 Configuration](#4-aws-s3-configuration)
- [Running the Application](#-running-the-application)
- [API Endpoints](#-api-endpoints)
- [Environment Variables](#-environment-variables)
- [Development Guidelines](#-development-guidelines)
- [Contributing](#-contributing)

---

## 🛠 Tech Stack

### Backend
- **Framework:** Django 5.0
- **API:** Django REST Framework 3.14
- **Database:** PostgreSQL 15+
- **ORM:** Django ORM (built-in)
- **File Storage:** AWS S3 (via django-storages)
- **Authentication:** Django built-in (expandable to JWT)

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite 5
- **State Management:** TanStack Query (React Query)
- **Styling:** Tailwind CSS
- **Form Handling:** React Hook Form + Zod validation
- **HTTP Client:** Axios
- **Icons:** Lucide React

### Infrastructure
- **Database:** PostgreSQL
- **File Storage:** AWS S3
- **Environment:** Python venv / Node.js

---

## 📁 Project Structure

```
rarion/
├── .gitignore                 # Git ignore rules for Django & React
├── README.md                  # This file
├── backend/                   # Django backend
│   ├── pokemon_inventory_backend/
│   │   ├── __init__.py
│   │   ├── settings.py        # Django settings with env vars
│   │   ├── urls.py            # Root URL configuration
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── inventory/             # Main Django app
│   │   ├── migrations/
│   │   ├── management/
│   │   │   └── commands/      # Custom management commands
│   │   ├── models.py          # Database models
│   │   ├── serializers.py     # DRF serializers
│   │   ├── views.py           # API ViewSets
│   │   ├── urls.py            # App URL routing
│   │   ├── filters.py         # Django-filter configurations
│   │   └── admin.py           # Admin site configuration
│   ├── requirements.txt       # Python dependencies
│   ├── manage.py
│   └── .env.example           # Example environment variables
└── frontend/                  # React frontend
    ├── src/
    │   ├── components/        # React components
    │   │   ├── common/        # Shared/reusable components
    │   │   ├── inventory/     # Inventory-related components
    │   │   ├── cards/         # Card-related components
    │   │   └── streams/       # Stream-related components
    │   ├── pages/             # Page components
    │   ├── services/          # API service functions
    │   ├── types/             # TypeScript interfaces
    │   ├── hooks/             # Custom React hooks
    │   ├── utils/             # Utility functions
    │   ├── App.tsx
    │   └── main.tsx
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── tsconfig.json
    └── .env.example
```

---

## 🗄 Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│   PokemonSet    │       │      Card       │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ name            │◄──────│ pokemon_set (FK)│
│ set_code (UNQ)  │       │ name            │
│ release_date    │       │ card_number     │
│ total_cards     │       │ rarity          │
│ series          │       │ card_type       │
│ created_at      │       │ image           │
│ updated_at      │       │ created_at      │
└─────────────────┘       │ updated_at      │
                          └────────┬────────┘
                                   │
                                   ▼
                          ┌─────────────────┐
                          │  InventoryItem  │
                          ├─────────────────┤
                          │ id (PK)         │
                          │ card (FK)       │
                          │ condition       │
                          │ quantity        │
                          │ purchase_price  │
                          │ current_price   │
                          │ location        │
                          │ notes           │
                          │ sku (UNQ, AUTO) │
                          │ created_at      │
                          │ updated_at      │
                          └────────┬────────┘
                                   │
                                   ▼
┌─────────────────┐       ┌─────────────────┐
│   StreamEvent   │       │ StreamInventory │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │◄──────│ stream_event(FK)│
│ title           │       │ inventory_item  │
│ stream_date     │       │   (FK)          │
│ platform        │       │ quantity_shown  │
│ notes           │       │ quantity_sold   │
│ created_at      │       │ featured        │
└─────────────────┘       │ created_at      │
                          │ updated_at      │
                          └─────────────────┘
```

### Model Relationships

- **PokemonSet → Card**: One-to-Many (A set contains many cards)
- **Card → InventoryItem**: One-to-Many (A card can have multiple inventory entries with different conditions)
- **StreamEvent → StreamInventory**: One-to-Many (A stream can feature many inventory items)
- **InventoryItem → StreamInventory**: One-to-Many (An inventory item can be featured in multiple streams)

### Field Choices

**Card Rarity:**
- Common, Uncommon, Rare, Holo Rare, Ultra Rare, Secret Rare

**Card Type:**
- Pokemon, Trainer, Energy

**Inventory Condition:**
- Mint, Near Mint, Lightly Played, Moderately Played, Heavily Played, Damaged

**Stream Platform:**
- Twitch, YouTube, Other

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- **Python 3.11+** ([Download](https://www.python.org/downloads/))
- **Node.js 18+** ([Download](https://nodejs.org/))
- **PostgreSQL 15+** ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/downloads))
- **AWS Account** (for S3 storage)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd rarion
```

### 2. Backend Setup

#### 2.1 Create and Activate Virtual Environment

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

#### 2.2 Install Python Dependencies

```bash
pip install -r requirements.txt
```

#### 2.3 Set Up PostgreSQL Database

```sql
-- Connect to PostgreSQL and run:
CREATE DATABASE pokemon_inventory;
CREATE USER pokemon_user WITH PASSWORD 'your_secure_password';
ALTER ROLE pokemon_user SET client_encoding TO 'utf8';
ALTER ROLE pokemon_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE pokemon_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE pokemon_inventory TO pokemon_user;
```

#### 2.4 Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your actual values
# See Environment Variables section below for details
```

#### 2.5 Run Database Migrations

```bash
python manage.py migrate
```

#### 2.6 Create Superuser (Admin Account)

```bash
python manage.py createsuperuser
```

#### 2.7 (Optional) Generate Sample Data

```bash
python manage.py generate_sample_data
```

#### 2.8 Start Django Development Server

```bash
python manage.py runserver
```

The API will be available at: `http://localhost:8000/api/`
Admin panel: `http://localhost:8000/admin/`

### 3. Frontend Setup

#### 3.1 Install Node Dependencies

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install
```

#### 3.2 Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit with your values
```

#### 3.3 Start React Development Server

```bash
npm run dev
```

The frontend will be available at: `http://localhost:3000/`

### 4. AWS S3 Configuration

#### 4.1 Create S3 Bucket

1. Log in to AWS Console
2. Navigate to S3
3. Create a new bucket (e.g., `pokemon-inventory-media`)
4. Configure bucket settings:
   - Block all public access: **OFF** (for public image access)
   - Enable versioning: Optional but recommended
   - Enable server-side encryption: Recommended

#### 4.2 Create IAM User

1. Navigate to IAM
2. Create a new user with programmatic access
3. Attach policy: `AmazonS3FullAccess` (or create a custom policy for the specific bucket)
4. Save the Access Key ID and Secret Access Key

#### 4.3 Configure CORS for S3 Bucket

Add this CORS configuration to your bucket:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
        "ExposeHeaders": []
    }
]
```

#### 4.4 Update Environment Variables

Add AWS credentials to your backend `.env` file.

---

## 🏃 Running the Application

### Development Mode

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
venv\Scripts\activate  # Windows
python manage.py runserver
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Access Points

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000/api/ |
| Admin Panel | http://localhost:8000/admin/ |
| API Documentation | http://localhost:8000/api/docs/ |

---

## 🔌 API Endpoints

### Pokemon Sets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sets/` | List all sets |
| POST | `/api/sets/` | Create a set |
| GET | `/api/sets/{id}/` | Get set details |
| PUT | `/api/sets/{id}/` | Update a set |
| DELETE | `/api/sets/{id}/` | Delete a set |

### Cards
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cards/` | List all cards |
| POST | `/api/cards/` | Create a card |
| GET | `/api/cards/{id}/` | Get card details |
| PUT | `/api/cards/{id}/` | Update a card |
| DELETE | `/api/cards/{id}/` | Delete a card |

### Inventory Items
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory/` | List inventory |
| POST | `/api/inventory/` | Add inventory item |
| GET | `/api/inventory/{id}/` | Get item details |
| PUT | `/api/inventory/{id}/` | Update item |
| DELETE | `/api/inventory/{id}/` | Delete item |

### Stream Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/streams/` | List streams |
| POST | `/api/streams/` | Create stream |
| GET | `/api/streams/{id}/` | Get stream details |
| PUT | `/api/streams/{id}/` | Update stream |
| DELETE | `/api/streams/{id}/` | Delete stream |

### Stream Inventory
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stream-inventory/` | List stream inventory |
| POST | `/api/stream-inventory/` | Add to stream |
| GET | `/api/stream-inventory/{id}/` | Get details |
| PUT | `/api/stream-inventory/{id}/` | Update |
| DELETE | `/api/stream-inventory/{id}/` | Remove |

---

## 🔐 Environment Variables

### Backend (.env)

```env
# Django Settings
DJANGO_SECRET_KEY=your-super-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (PostgreSQL)
DB_NAME=pokemon_inventory
DB_USER=pokemon_user
DB_PASSWORD=your_database_password
DB_HOST=localhost
DB_PORT=5432

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_STORAGE_BUCKET_NAME=your-bucket-name
AWS_S3_REGION_NAME=us-east-1

# CORS Settings
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Frontend (.env)

```env
# API Configuration
VITE_API_URL=http://localhost:8000/api

# AWS S3 (for displaying images)
VITE_AWS_S3_BUCKET_URL=https://your-bucket-name.s3.amazonaws.com
```

---

## 📝 Development Guidelines

### Code Style

**Python/Django:**
- Follow PEP 8 style guide
- Use type hints where applicable
- Write docstrings for all functions and classes

**TypeScript/React:**
- Use strict TypeScript mode
- Prefer functional components with hooks
- Use proper TypeScript interfaces for all data structures

### Git Workflow

1. Create feature branches from `main`
2. Use descriptive commit messages
3. Open pull requests for code review
4. Squash and merge when approved

### Testing

```bash
# Backend tests
cd backend
python manage.py test

# Frontend tests
cd frontend
npm run test
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Pokemon and all related trademarks are property of Nintendo/The Pokemon Company
- This project is for personal inventory management purposes only
