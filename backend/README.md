# Relife Habits Backend

A modular Node.js backend built with **Fastify** and **MySQL**. This system handles user authentication, session-based security, reCAPTCHA verification, and a quest scheduling system.

---

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Fastify
- **Database:** MySQL (via XAMPP / MariaDB)
- **Authentication:** Bcrypt (Hashing) & Fastify-Session

---

## 🚀 Getting Started

### 1. Prerequisites

- Install [Node.js](https://nodejs.org/) (v18+)
- Install [XAMPP](https://www.apachefriends.org/index.html) and ensure the **MySQL** module is running.

### 2. Installation

Clone the project and install the required dependencies:

```bash
git clone [https://github.com/prodat123/relife.git](https://github.com/prodat123/relife.git)
cd backend
npm install
```

### 3. Database Setup

1. Open phpMyAdmin.
2. Create a database named `relife_db`.
3. Import the [schema.sql](./schema.sql) file found in this directory.

### 4. Create an ENV setup in the backend folder

DB_IP=127.0.0.1
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_DATABASE=relife_db
RECAPTCHA_SECRET_KEY=your_secret_key
SESSION_SECRET=a_very_long_random_string
