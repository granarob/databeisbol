import os
import django
from datetime import date

# Configurar entorno de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import League, Season, Category, Team, User

def populate():
    print("Iniciando la carga de datos de prueba...")
    
    # Corregir la desincronización de secuencias en PostgreSQL
    from django.db import connection
    tables_to_sync = ['leagues', 'seasons', 'categories', 'teams', 'users', 'stadiums', 'games', 'stats_batting', 'stats_pitching']
    with connection.cursor() as cursor:
        print("Sincronizando secuencias de PostgreSQL...")
        for table in tables_to_sync:
            try:
                # Comprobar si existe la secuencia para evitar fallos si el nombre cambia
                cursor.execute(f"SELECT pg_get_serial_sequence('{table}', 'id');")
                seq = cursor.fetchone()[0]
                if seq:
                    cursor.execute(f"SELECT setval('{seq}', COALESCE(MAX(id), 0) + 1, false) FROM {table};")
            except Exception as e:
                print(f"  Aviso sincronizando {table}: {e}")
                
    # Obtener o crear un usuario administrador para las ligas
    admin_user = User.objects.filter(role='super_admin').first()
    if not admin_user:
        admin_user = User.objects.filter(is_superuser=True).first()
    if not admin_user:
        admin_user = User.objects.first()
    
    # Datos de las 3 ligas
    ligas_data = [
        {"name": "Liga Central de Béisbol", "city": "Caracas", "country": "Venezuela"},
        {"name": "Liga del Este de Miranda", "city": "Los Teques", "country": "Venezuela"},
        {"name": "Liga de Béisbol del Oeste", "city": "Barquisimeto", "country": "Venezuela"}
    ]
    
    # 4 Categorías estándar
    categorias_data = [
        {"name": "Semillita", "age_min": 4, "age_max": 6},
        {"name": "Pre-Infantil", "age_min": 7, "age_max": 9},
        {"name": "Infantil", "age_min": 10, "age_max": 12},
        {"name": "Juvenil", "age_min": 13, "age_max": 16}
    ]
    
    # 4 Equipos por categoría
    equipos_por_categoria = {
        "Semillita": [
            {"name": "Cardenalitos", "short_name": "CAR"},
            {"name": "Leoncitos", "short_name": "LEO"},
            {"name": "Naveganticos", "short_name": "NAV"},
            {"name": "Tigritos", "short_name": "TIG"}
        ],
        "Pre-Infantil": [
            {"name": "Astros del Valle", "short_name": "AST"},
            {"name": "Cachorros de Caracas", "short_name": "CAC"},
            {"name": "Gatos del Centro", "short_name": "GAT"},
            {"name": "Halcones del Norte", "short_name": "HAL"}
        ],
        "Infantil": [
            {"name": "Bravos del Este", "short_name": "BRA"},
            {"name": "Tiburones Junior", "short_name": "TIB"},
            {"name": "Gigantes de la Costa", "short_name": "GIG"},
            {"name": "Águilas Metropolitanas", "short_name": "AGU"}
        ],
        "Juvenil": [
            {"name": "Guerreros del Tuy", "short_name": "GUE"},
            {"name": "Centauros del Llano", "short_name": "CEN"},
            {"name": "Lanceros del Prado", "short_name": "LAN"},
            {"name": "Vikingos de la Capital", "short_name": "VIK"}
        ]
    }
    
    for liga_info in ligas_data:
        # 1. Crear o recuperar la Liga
        liga, created = League.objects.get_or_create(
            name=liga_info["name"],
            defaults={
                "city": liga_info["city"],
                "country": liga_info["country"],
                "admin": admin_user
            }
        )
        if created:
            print(f"Creada liga: {liga.name}")
        else:
            print(f"Liga ya existente: {liga.name}")
            
        # 2. Crear Temporada Activa para la Liga
        season, s_created = Season.objects.get_or_create(
            league=liga,
            name="Temporada Regular 2026",
            defaults={
                "start_date": date(2026, 1, 1),
                "end_date": date(2026, 12, 31),
                "is_active": True
            }
        )
        if s_created:
            print(f"  -> Creada temporada activa: {season.name}")
        else:
            # Asegurar que esté activa para pruebas
            if not season.is_active:
                season.is_active = True
                season.save()
            print(f"  -> Temporada existente: {season.name}")
            
        # 3. Crear las 4 Categorías para esta Liga
        for cat_info in categorias_data:
            categoria, c_created = Category.objects.get_or_create(
                league=liga,
                name=cat_info["name"],
                defaults={
                    "age_min": cat_info["age_min"],
                    "age_max": cat_info["age_max"]
                }
            )
            if c_created:
                print(f"    -> Creada categoría: {categoria.name}")
            else:
                print(f"    -> Categoría existente: {categoria.name}")
                
            # 4. Crear los 4 Equipos para esta Categoría y Temporada
            equipos = equipos_por_categoria[categoria.name]
            for eq_info in equipos:
                # Agregar el nombre de la liga o ciudad a la abreviatura para evitar duplicados visuales si aplica, 
                # pero mantenemos el short_name corto
                team, t_created = Team.objects.get_or_create(
                    category=categoria,
                    season=season,
                    name=f"{eq_info['name']} ({liga.city})",
                    defaults={
                        "short_name": eq_info["short_name"],
                        "manager_name": "Coach de Prueba",
                        "won": 0,
                        "lost": 0,
                        "tied": 0
                    }
                )
                if t_created:
                    print(f"      - Creado equipo: {team.name} ({team.short_name})")
                else:
                    print(f"      - Equipo ya existente: {team.name}")
                    
    print("\n¡Carga de datos de prueba finalizada exitosamente!")

if __name__ == '__main__':
    populate()
