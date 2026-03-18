# Usa una imagen oficial de Python
FROM python:3.11-slim

# Evita que Python genere archivos .pyc y use buffer para los logs
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Establece el directorio de trabajo
WORKDIR /app

# Instala dependencias del sistema necesarias para psycopg2 y el build
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copia los archivos de requerimientos
COPY requirements.txt .

# Instala las librerías de Python
RUN pip install --no-cache-dir -r requirements.txt

# Copia el resto del código del proyecto
COPY . .

# Recopila archivos estáticos (Django)
RUN SECRET_KEY=dummy-key-for-build python manage.py collectstatic --no-input

# Expone el puerto (informativo, Railway asigna el real)
EXPOSE 8000

# Comando para arrancar la aplicación usando el puerto de Railway
CMD gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 60
