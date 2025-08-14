
# 🚀 FastAPI + Supabase Integration Project

This project is a backend API built with **FastAPI** and connected to a **Supabase PostgreSQL** database. It also integrates with **ngrok** to expose the local server for testing with public endpoints.

---

## ✅ Features Implemented So Far

- ✅ FastAPI project structure set up
- ✅ Environment variables managed via `.env`
- ✅ Connected to Supabase database using `psycopg2`
- ✅ Verified secure connection using SSL
- ✅ Established tunnel using **ngrok** for public access

---

## 🔧 Requirements

Make sure to have the following installed:

- Python 3.10+
- pip
- `psycopg2-binary`
- `python-dotenv`
- `ngrok` (installed and authtoken configured)

## ▶️ How to Run the Project

1. **Run the FastAPI app (with ngrok tunnel):**

```bash
python main.py
```

2. **Start server normally without ngrok (optional):**

```bash
uvicorn app:app --reload
```

3. **ngrok (if not automated):**

```bash
ngrok http 8000
```

Then use the forwarded `https://xxxx.ngrok-free.app` URL as the public endpoint.

---

## 🧪 Verify the DB Connection

You should see logs like:

```
✅ Database connection successful.
✅ Ngrok tunnel established successfully at https://your-tunnel.ngrok-free.app
🚀 Starting FastAPI server on http://0.0.0.0:8000 / http://127.0.0.1:8000 
```

---

## 📁 Project Structure

```
├── app.py
├── database_connection.py   # (psycopg2 connection logic)
├── .env
├── requirements.txt
└── README.md
```

---

## 📌 Next Steps

- Add user authentication routes
- Use Supabase REST or Supabase client (optional)
- Replace raw psycopg2 with SQLAlchemy for model integration

---

## 🧑‍💻 Made with ❤️ using FastAPI and Supabase

