# Vercel serverless entry — imports the FastAPI app
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from main import app  # noqa: F401
