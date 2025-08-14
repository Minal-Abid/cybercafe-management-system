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

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# ✅ SUPABASE CONNECTIVITY CHECK
@app.on_event("startup")
async def check_supabase_connectivity():
    supabase_url = os.getenv("DATABASE_URL")
    if not supabase_url:
        logger.error("❌ DATABASE_URL (Supabase) is missing in .env")
        return

    try:
        # Extract domain from full Supabase connection string
        supabase_domain = supabase_url.split('@')[-1].split(':')[0]
        supabase_ping_url = f"https://{supabase_domain}"

        logger.info(f"🔍 Checking Supabase availability at {supabase_ping_url}...")
        response = requests.get(supabase_ping_url, timeout=5)

        if response.status_code == 200:
            logger.info("✅ Supabase is reachable!")
        else:
            logger.warning(f"⚠️ Supabase responded with status: {response.status_code}")

    except Exception as e:
        logger.error(f"❌ Supabase connectivity check failed: {str(e)}")

# ✅ SSL TEST BEFORE NGROK
def test_ssl_connection():
    try:
        import urllib.request
        urllib.request.urlopen('https://www.google.com', timeout=10)
        logger.info("✅ SSL test passed")
        return True
    except Exception as e:
        logger.warning(f"❌ SSL test failed: {e}")
        return False

# ✅ NGROK SETUP WITH RETRY
def setup_ngrok_with_retry():
    try:
        from pyngrok import ngrok
        from pyngrok.exception import PyngrokNgrokInstallError

        if not test_ssl_connection():
            logger.warning("Continuing despite SSL failure...")

        port = 8000
        ngrok_auth_token = os.getenv("NGROK_AUTH_TOKEN")

        if ngrok_auth_token:
            try:
                ngrok.set_auth_token(ngrok_auth_token)
                logger.info("🔑 Ngrok authtoken set")
                time.sleep(2)
            except PyngrokNgrokInstallError as e:
                logger.error(f"Ngrok install error: {e}")
                return None, port
        else:
            logger.warning("⚠️ NGROK_AUTH_TOKEN not found")
            return None, port

        try:
            ngrok_domain = os.getenv("BACKEND_ngrok_LINK")
            logger.info(f"⛓️ Starting ngrok tunnel with domain: {ngrok_domain}")
            public_url = ngrok.connect(port).public_url
            logger.info(f"✅ Ngrok tunnel live at: {public_url}")
            return public_url, port
        except Exception as e:
            logger.error(f"❌ Failed to start ngrok: {str(e)}")
            return None, port

    except ImportError as e:
        logger.error(f"❌ pyngrok not installed: {e}")
        return None, 8000

# ✅ START THE SERVER
if __name__ == "__main__":
    import uvicorn

    public_url, port = setup_ngrok_with_retry()

    if public_url:
        logger.info(f"🌐 Server available at: {public_url}")
    else:
        logger.info(f"🔒 Local server running at: http://127.0.0.1:{port}")

    print(f"✅ Open your app at: http://127.0.0.1:{port}")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
