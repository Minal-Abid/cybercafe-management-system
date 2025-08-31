# Backend/main.py
import os
import time
import requests
from pathlib import Path
from loguru import logger
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from dotenv import load_dotenv
from Backend.app import router   # ✅ imports router
from Backend.database import supabase   # ✅ supabase client

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent

app = FastAPI()
app.include_router(router)

# Mount static files and templates
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

@app.on_event("startup")
async def startup_checks():
    supabase_http = os.getenv("SUPABASE_URL")

    if supabase_http:
        try:
            resp = requests.get(supabase_http, timeout=6)
            if resp.status_code == 200:
                logger.info("✅ Supabase host reachable at {}", supabase_http)
            else:
                logger.warning("⚠ Supabase returned status {}", resp.status_code)
        except Exception as e:
            logger.warning("⚠ Could not reach {} — {}", supabase_http, e)
    else:
        logger.warning("⚠ No SUPABASE_URL found in environment.")

def test_ssl_connection():
    try:
        import urllib.request
        urllib.request.urlopen('https://www.google.com', timeout=10)
        logger.info("✅ SSL test passed")
        return True
    except Exception as e:
        logger.warning(f"❌ SSL test failed: {e}")
        return False

def setup_ngrok_with_retry():
    if os.getenv("ENABLE_NGROK", "false").lower() != "true":
        logger.info("Ngrok disabled. Skipping ngrok setup.")
        return None, int(os.environ.get("PORT", 8000))

    try:
        from pyngrok import ngrok
        if not test_ssl_connection():
            logger.warning("Continuing despite SSL test failure...")

        ngrok_auth_token = os.getenv("NGROK_AUTH_TOKEN")
        if ngrok_auth_token:
            ngrok.set_auth_token(ngrok_auth_token)
            logger.info("Ngrok auth token set")
            time.sleep(1)
        else:
            logger.warning("NGROK_AUTH_TOKEN not set; starting free tunnel")

        port = int(os.environ.get("PORT", 8000))
        public_url = ngrok.connect(port).public_url
        logger.info("Ngrok tunnel started at {}", public_url)
        return public_url, port
    except Exception as e:
        logger.warning("Ngrok setup failed: {}", e)
        return None, int(os.environ.get("PORT", 8000))

if __name__ == "__main__":
    import uvicorn

    public_url, port = setup_ngrok_with_retry()
    if public_url:
        logger.info("🌐 App reachable at %s", public_url)
    else:
        logger.info("🔒 Local app starting on port %s", port)

    uvicorn.run("Backend.main:app", host="0.0.0.0", port=port, reload=True)
