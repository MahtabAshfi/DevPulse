# DevPulse API

DevPulse is a backend API built with Express, TypeScript, and PostgreSQL designed to manage user authentication and track project issues effortlessly. The application is optimized for serverless performance and deployed on Vercel.

🔗 **Live Deployment URL:** [devpulse-ten-delta.vercel.app]

---

## **Features**

* **User Authentication:** Secure user registration and role-based assignments (`contributor`, `manager`, etc.).
* **Issue Tracking:** Full CRUD capabilities for managing, reporting, and organizing development issues.
* **Type Safety:** Written completely in TypeScript for reliable compile-time error checking.

---

## **Tech Stack**

* **Backend Framework:** Node.js, Express.js
* **Language:** TypeScript
* **Database:** PostgreSQL (Hosted via Neon DB)
* **Database Driver:** `pg` (node-postgres)
* **Deployment & Hosting:** Vercel

---

## **Local Setup & Installation**

Follow these steps to clone the repository and run the development server locally:

### 1. Clone the Repository
```bash
git clone [https://github.com/MahtabAshfi/DevPulse.git]
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory of your project:
```bash
PORT = 5000
DATABASE_URL = your_postgresql_connection_here
JWT_SECRET = your_jwt_key_here\
```

### 4. Run the Development Server
```bash
npm run dev
```


## **API Endpoint Reference**

### Base Route
| Method | Endpoint | Description |
| :---: | :---: | :--- |
| `GET` | `/` | Welcome Message |

### Authentication Routes
| Method | Endpoint | Description |
| :---: | :---: | :---: |
| `POST` | `/api/auth/signup` | Register a new user account |
| `POST` | `/api/auth/login` | Authenticate a user and receive a token |

### Issues Routes
| Method | Endpoint | Description |
| :---: | :---: | :---: |
| `GET` | `/api/issues` | Retrieve a list of all logged issues |
| `POST` | `/api/issues` | Create a new issue |
| `GET` | `/api/issues/:id` | Fetch details of a specific issue by ID |
| `PUT` | `/api/issues/:id` | Update an existing issue|
| `DELETE` | `/api/issues/:id` | Remove an issue from the system |


## **Database Schema Summary**

The database uses a PostgreSQL structure with the following entities:

### Users Table
| Column | Data Type | Constraints |
| :---: | :---: | :---: |
| `id` | `SERIAL` | `PRIMARY KEY` |
| `name` | `VARCHAR(255)` | `NOT NULL` |
| `email` | `VARCHAR(255)` | `NOT NULL`, `UNIQUE` |
| `password` | `VARCHAR(255)` | `NOT NULL` |
| `role` | `VARCHAR(50)` | `NOT NULL` |

---

### Issues Table
| Column | Data Type | Constraints |
| :---: | :---: | :---: |
| `id` | `SERIAL` | `PRIMARY KEY` |
| `title` | `VARCHAR(255)` | `NOT NULL` |
| `description` | `TEXT` | `NOT NULL` |
| `status` | `VARCHAR(50)` | `NOT NULL`  |
