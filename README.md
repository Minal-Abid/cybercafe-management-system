# ☕ CyberCafe Management System

A **full-stack web application** built to manage a cybercafe environment.
The system allows users to log in, track usage, and interact with the platform while administrators can manage the system through a dedicated dashboard.

This project was developed during an internship and later expanded with additional features and improvements.

---

# 🌐 Features

### User Features

* User authentication (login/register)
* Interactive dashboard
* Leaderboard system
* Responsive web interface
* Real-time interaction with backend services

### Admin Features

* Admin dashboard
* User management interface
* Monitoring system usage
* Managing Challenges
* Adding Challenges
* Data stored and retrieved from a PostgreSQL database

---

# 🧰 Tech Stack

**Backend**

* FastAPI
* Python
* PostgreSQL (Supabase)

**Frontend**

* HTML
* CSS
* JavaScript
* Jinja Templates

**Infrastructure**

* Supabase (Database)
* ngrok (local public testing)
* Docker
* Render (deployment)

---

# 📁 Project Structure

```
CyberCafe/
│
├── Backend/
│   ├── main.py
│   ├── app.py
│   ├── database.py
│   ├── __init__.py 
│   ├── __pycache__
│   ├── templates/
│   └── static/
│
├── Frontend/
│
├── requirements.txt
├── Dockerfile
├── .gitignore
├── .dockerignore
└── README.md
```

---

# ⚙️ Setup Instructions

### 1️⃣ Clone the repository

```
git clone https://github.com/minalabid/cybercafe-management-system.git
cd cybercafe-management-system
```

### 2️⃣ Create a virtual environment

```
python -m venv venv
```

Activate it:

Windows

```
venv\Scripts\activate
```

Mac/Linux

```
source venv/bin/activate
```

---

### 3️⃣ Install dependencies

```
pip install -r requirements.txt
```

---

### 4️⃣ Configure environment variables

Create a `.env` file and add:

```
DATABASE_URL=your_supabase_database_url
SUPABASE_KEY=your_api_key
```

---

### 5️⃣ Run the application

```
uvicorn Backend.main:app --reload
```

Server will start at:

```
http://127.0.0.1:8000
```

---

# 🚀 Deployment

The application can be deployed using:

* **Render**
* **Docker containers**
* **Cloud platforms supporting FastAPI**

---

# 📈 Future Improvements

* Role-based authentication system
* Payment integration for cybercafe sessions
* Real-time usage tracking
* Mobile-friendly UI improvements
* Database optimization

---

# 👩‍💻 Author

**Minal Abid**
BS Computer Science Student

This project is part of my growing portfolio in **backend development, full-stack systems, and database-driven applications.**
