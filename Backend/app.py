from pathlib import Path
import models
from database import engine
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

# Create DB tables
models.Base.metadata.create_all(bind=engine)

router = APIRouter()
BASE_DIR = Path(__file__).resolve().parent
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

# 🏠 Home page
@router.get("/", response_class=HTMLResponse)
def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# 👤 Auth page
@router.get("/auth", response_class=HTMLResponse)
def auth_page(request: Request):
    return templates.TemplateResponse("auth.html", {"request": request})

# 📊 Dashboard
@router.get("/dashboard", response_class=HTMLResponse)
def dashboard_page(request: Request):
    return templates.TemplateResponse("dashboard.html", {"request": request})

# 🏆 Leaderboard
@router.get("/leaderboard", response_class=HTMLResponse)
def leaderboard_page(request: Request):
    return templates.TemplateResponse("leaderboard.html", {"request": request})

# 💳 Plans page
@router.get("/plans", response_class=HTMLResponse)
def plans_page(request: Request):
    return templates.TemplateResponse("plans.html", {"request": request})

# 💰 Payment page
@router.get("/payment", response_class=HTMLResponse)
def payment_page(request: Request):
    return templates.TemplateResponse("payment.html", {"request": request})

# 🛠️ Admin Panel
@router.get("/admin", response_class=HTMLResponse)
def admin_page(request: Request):
    return templates.TemplateResponse("admin.html", {"request": request})

# ℹ️ About page
@router.get("/about", response_class=HTMLResponse)
def about_page(request: Request):
    return templates.TemplateResponse("about.html", {"request": request})
