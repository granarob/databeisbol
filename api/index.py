# Vercel Serverless Handler para Django
# Este archivo actúa como entry point para las funciones serverless de Vercel.
# Vercel enruta las peticiones /api/* y /admin/* a este handler WSGI.

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Vercel espera un objeto `app` que sea un WSGI callable
app = get_wsgi_application()
