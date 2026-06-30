"""
Vercel serverless entry point.
This file exports the FastAPI app for Vercel Python runtime.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from main import app  # noqa: F401 — Vercel looks for `app`
