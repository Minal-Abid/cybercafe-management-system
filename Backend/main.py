# main.py
import os
import time
import requests
from loguru import logger
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from dotenv import load_dotenv
from app import router

load_dotenv()

app = FastAPI()
app.include_router(router)

# Mount static files and templates (these must match your repo layout)
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

@app.on_event("startup")
async def startup_checks():
    """
    Simple connectivity checks. Non-fatal: we log warnings/errors but continue.
    """
    # Prefer explicit SUPABASE_URL (HTTP endpoint) if available
    supabase_http = os.getenv("SUPABASE_URL")
    db_url = os.getenv("DATABASE_URL")

    if not supabase_http and db_url:
        # try to extract a host from DATABASE_URL: postgres://user:pass@host:port/db
        try:
            supabase_http = db_url.split("@")[-1].split(":")[0]
            supabase_http = f"https://{supabase_http}"
            logger.info("Derived HTTP host from DATABASE_URL: {}", supabase_http)
        except Exception:
            supabase_http = None

    if supabase_http:
        try:
            resp = requests.get(supabase_http, timeout=6)
            if resp.status_code == 200:
                logger.info("✅ Supabase/DB host reachable at {}", supabase_http)
            else:
                logger.warning("⚠ Supabase/DB host returned status {}", resp.status_code)
        except Exception as e:
            logger.warning("⚠ Could not reach {} — {}", supabase_http, e)
    else:
        logger.warning("⚠ No SUPABASE_URL or DATABASE_URL found in environment. Some features may break.")

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
    # ngrok is optional and only enabled if ENABLE_NGROK=true
    if os.getenv("ENABLE_NGROK", "false").lower() != "true":
        logger.info("Ngrok disabled (ENABLE_NGROK != true). Skipping ngrok setup.")
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
            logger.warning("NGROK_AUTH_TOKEN not set; starting free tunnel (may be limited)")

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

    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
