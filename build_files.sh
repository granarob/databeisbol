#!/bin/bash
# Build script para Vercel — se ejecuta durante el deploy
# Instala dependencias Python, recolecta estáticos y ejecuta migraciones

echo ">>> Instalando dependencias Python..."
pip install -r requirements.txt

echo ">>> Recolectando archivos estáticos..."
python manage.py collectstatic --no-input --clear

echo ">>> Ejecutando migraciones de base de datos..."
python manage.py migrate --no-input

echo ">>> Build completado ✓"
