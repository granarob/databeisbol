from pathlib import Path
from decouple import config, Csv
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

# ─── SEGURIDAD ──────────────────────────────────────────────────
SECRET_KEY  = config('SECRET_KEY')
DEBUG       = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='.vercel.app,.up.railway.app,localhost,127.0.0.1', cast=Csv())

# ─── APLICACIONES ───────────────────────────────────────────────
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt',
    'core',
]

# ─── MIDDLEWARE ──────────────────────────────────────────────────
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',   # ← sirve archivos estáticos en producción
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# ─── CORS ───────────────────────────────────────────────────────
_cors_origins = config('CORS_ALLOWED_ORIGINS', default='http://localhost:3000,http://127.0.0.1:3000', cast=Csv())
CORS_ALLOWED_ORIGINS = list(_cors_origins) + [
    'https://databeisbol-d51z.vercel.app',      # Frontend producción
    'https://web-production-fa4f.up.railway.app', # Backend Railway
]
CORS_ALLOW_ALL_ORIGINS = True  # Temporal para preview público
CORS_ALLOW_CREDENTIALS = True

# ─── CSRF TRUSTED ORIGINS (Vercel) ──────────────────────────────
CSRF_TRUSTED_ORIGINS = config(
    'CSRF_TRUSTED_ORIGINS',
    default='https://*.vercel.app,https://*.up.railway.app,https://databeisbol-d51z.vercel.app,http://localhost:3000,http://127.0.0.1:3000',
    cast=Csv()
)

# ─── URLS / WSGI ────────────────────────────────────────────────
ROOT_URLCONF      = 'config.urls'
WSGI_APPLICATION  = 'config.wsgi.application'

# ─── TEMPLATES ──────────────────────────────────────────────────
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# ─── BASE DE DATOS ───────────────────────────────────────────────
# Usa DATABASE_URL si existe (Railway/Supabase), si no, cae en SQLite local
DATABASE_URL = config('DATABASE_URL', default=None)
if DATABASE_URL:
    try:
        import dj_database_url
        DATABASES = {
            'default': dj_database_url.parse(
                DATABASE_URL, 
                conn_max_age=600, 
                ssl_require=True,
                engine='django.db.backends.postgresql'  # Forzamos postgresql backend (psycopg3 compatible Django 4.2+)
            )
        }
    except ImportError:
        raise ImportError('dj-database-url no está instalado. Ejecuta: pip install dj-database-url')
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# ─── MODELO DE USUARIO ───────────────────────────────────────────
AUTH_USER_MODEL = 'core.User'

# ─── DJANGO REST FRAMEWORK ───────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '5000/hour',
        'user': '10000/hour'
    }
}

# ─── CACHÉ (Redis / LocMem) ──────────────────────────────────────
REDIS_URL = config('REDIS_URL', default=None)
if REDIS_URL:
    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": REDIS_URL,
            "OPTIONS": {
                "CLIENT_CLASS": "django_redis.client.DefaultClient",
            }
        }
    }
else:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'unique-snowflake',
        }
    }

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':  timedelta(hours=8),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# ─── VALIDADORES DE CONTRASEÑA ───────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ─── LOCALIZACIÓN ────────────────────────────────────────────────
LANGUAGE_CODE = 'es-ve'
TIME_ZONE     = 'America/Caracas'
USE_I18N      = True
USE_TZ        = True

# ─── ARCHIVOS ESTÁTICOS (WhiteNoise) ─────────────────────────────
STATIC_URL  = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ─── SEGURIDAD HTTPS (solo en producción) ────────────────────────
if not DEBUG:
    SECURE_HSTS_SECONDS           = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD           = True
    SECURE_SSL_REDIRECT           = config('SECURE_SSL_REDIRECT', default=True, cast=bool)
    SESSION_COOKIE_SECURE         = True
    CSRF_COOKIE_SECURE            = True
    SECURE_PROXY_SSL_HEADER       = ('HTTP_X_FORWARDED_PROTO', 'https')
