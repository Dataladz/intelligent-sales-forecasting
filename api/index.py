import sys
import os

# Add root directory to the python path so it can import from `src`
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.api.app import app
