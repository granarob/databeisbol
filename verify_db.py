import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection
from core.models import User, League, Team, Player

print("\n" + "="*40)
print("=== ESTADO DE LA BASE DE DATOS ===")
print("="*40)
print(f"URL de Conexión: {connection.settings_dict['NAME']}")
print("-" * 40)
try:
    print(f"Usuarios : {User.objects.count()}")
    print(f"Ligas    : {League.objects.count()}")
    print(f"Equipos  : {Team.objects.count()}")
    print(f"Jugadores: {Player.objects.count()}")
    print("="*40)
    print("✅ ¡La conexión a Supabase y la data funciona correctamente!")
except Exception as e:
    print(f"❌ Error al consultar la BD: {e}")
