import os
import django
import random
from datetime import datetime, timedelta
from django.utils import timezone

# Configurar entorno de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import transaction, connection
from core.models import League, Season, Category, Team, Player, Roster, Stadium, Game, StatsBatting, StatsPitching

# Nombres y Apellidos venezolanos realistas para la generación dinámica de peloteros
PRIMEROS_NOMBRES = [
    "Santiago", "Sebastián", "Matías", "Mateo", "Nicolás", "Alejandro", "Diego", "Samuel", 
    "Benjamin", "Daniel", "Gabriel", "Luis", "Carlos", "José", "Francisco", "Andrés", "Miguel",
    "Juan", "David", "Ángel", "Jesús", "Adrian", "Eduardo", "Leonardo", "Samuel", "Aaron"
]

APELLIDOS = [
    "González", "Rodríguez", "Gómez", "Fernández", "Díaz", "Álvarez", "Pérez", "Ruiz", "Hernández",
    "Sánchez", "Martínez", "Romero", "Torres", "Ramírez", "Flores", "Acosta", "Medina", "Herrera",
    "Guzmán", "Castillo", "Castro", "Mendoza", "Silva", "Rojas", "Marquez", "Blanco", "Mora"
]

POSICIONES = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF']

def sync_db_sequences():
    """
    Sincroniza todas las secuencias seriales de PostgreSQL para evitar IntegrityError (UniqueViolation)
    cuando se insertan registros con IDs autoincrementales después de cargar un backup.
    """
    tables_to_sync = ['leagues', 'seasons', 'categories', 'teams', 'users', 'stadiums', 'games', 'stats_batting', 'stats_pitching', 'players', 'rosters']
    with connection.cursor() as cursor:
        print("[DB-Sync] Sincronizando secuencias de PostgreSQL...")
        for table in tables_to_sync:
            try:
                # Comprobar si existe la secuencia para evitar fallos si el nombre cambia
                cursor.execute(f"SELECT pg_get_serial_sequence('{table}', 'id');")
                res = cursor.fetchone()
                if res and res[0]:
                    seq = res[0]
                    cursor.execute(f"SELECT setval('{seq}', COALESCE(MAX(id), 0) + 1, false) FROM {table};")
            except Exception as e:
                print(f"  [Aviso] Sincronizando {table}: {e}")
    print("[DB-Sync] Secuencias sincronizadas de manera exitosa.")

def get_or_create_stadiums():
    stadium_names = ["Estadio Universitario", "Estadio José Bernardo Pérez", "Estadio Antonio Herrera Gutiérrez", "Polideportivo Chacao"]
    stadiums = []
    for name in stadium_names:
        stad, _ = Stadium.objects.get_or_create(
            name=name,
            defaults={"location": "Venezuela"}
        )
        stadiums.append(stad)
    return stadiums

def fill_roster_if_needed(team, min_players=6):
    """
    Verifica los jugadores en el roster del equipo.
    Si tiene menos del mínimo, crea y asocia jugadores dinámicamente.
    """
    roster_count = Roster.objects.filter(team=team).count()
    if roster_count >= min_players:
        return [r.player for r in Roster.objects.filter(team=team)]
    
    players_created = []
    needed = min_players - roster_count
    
    # Obtener números de dorsal ya ocupados
    occupied_numbers = set(Roster.objects.filter(team=team).values_list('jersey_number', flat=True))
    
    for _ in range(needed):
        first = random.choice(PRIMEROS_NOMBRES)
        last = random.choice(APELLIDOS)
        
        # Edad aleatoria acorde a la categoría
        cat = team.category
        age = random.randint(cat.age_min, cat.age_max)
        birth_year = datetime.now().year - age
        birth_date = datetime.strptime(f"{birth_year}-{random.randint(1,12)}-{random.randint(1,28)}", "%Y-%m-%d").date()
        
        player = Player.objects.create(
            first_name=first,
            last_name=last,
            birth_date=birth_date,
            height_cm=random.randint(130 + (age * 3), 160 + (age * 3)),
            weight_kg=random.randint(30 + (age * 2), 60 + (age * 2)),
            bats_hand=random.choice(['R', 'L', 'S']),
            throws_hand=random.choice(['R', 'L']),
            bio=f"Joven prospecto de la categoria {cat.name}."
        )
        
        # Asignar número de dorsal disponible
        num = random.randint(1, 99)
        while num in occupied_numbers:
            num = random.randint(1, 99)
        occupied_numbers.add(num)
        
        # Crear asignación de Roster
        Roster.objects.create(
            team=team,
            player=player,
            jersey_number=num,
            is_active=True
        )
        players_created.append(player)
        
    print(f"      [Roster] Creados {needed} jugadores para el equipo: {team.name}")
    
    # Retornar todos los jugadores del roster
    return [r.player for r in Roster.objects.filter(team=team)]

def simulate():
    print("Iniciando simulacion de 25 juegos...")
    
    # Sincronizar secuencias primero para evitar errores de clave duplicada
    sync_db_sequences()
    
    stadiums = get_or_create_stadiums()
    categories = list(Category.objects.all())
    
    if not categories:
        print("[Error] No hay categorias registradas en la base de datos. Ejecuta primero populate_test_data.")
        return
    
    simulated_games_count = 0
    
    # Usar una transacción atómica para asegurar la consistencia total de los datos
    try:
        with transaction.atomic():
            for i in range(25):
                # 1. Seleccionar categoría y temporada de forma aleatoria
                category = random.choice(categories)
                season = category.league.seasons.filter(is_active=True).first()
                if not season:
                    season = category.league.seasons.first()
                
                # Obtener equipos de la categoría
                teams = list(Team.objects.filter(category=category))
                if len(teams) < 2:
                    continue
                
                home_team, away_team = random.sample(teams, 2)
                
                # 2. Rellenar rosters si es necesario para tener jugadores y simular estadísticas individuales
                home_players = fill_roster_if_needed(home_team, min_players=6)
                away_players = fill_roster_if_needed(away_team, min_players=6)
                
                # 3. Generar resultado de juego
                home_score = random.randint(0, 12)
                away_score = random.randint(0, 12)
                
                # Determinar ganador/perdedor
                if home_score > away_score:
                    home_team.won += 1
                    away_team.lost += 1
                elif away_score > home_score:
                    away_team.won += 1
                    home_team.lost += 1
                else:
                    home_team.tied += 1
                    away_team.tied += 1
                
                home_team.save()
                away_team.save()
                
                # 4. Crear registro de Juego
                stadium = random.choice(stadiums)
                game_date = timezone.now() - timedelta(days=random.randint(1, 28), hours=random.randint(8, 18))
                
                game = Game.objects.create(
                    season=season,
                    category=category,
                    home_team=home_team,
                    away_team=away_team,
                    stadium=stadium,
                    game_date=game_date,
                    status=Game.Status.FINISHED,
                    home_score=home_score,
                    away_score=away_score
                )
                
                # 5. Simular estadísticas de Bateo para cada equipo (5 jugadores por equipo)
                # Bateadores del equipo Local
                for player in random.sample(home_players, min(5, len(home_players))):
                    ab = random.randint(2, 5)
                    h = random.randint(0, ab)
                    
                    # Distribuir extrabases
                    doubles, triples, hr = 0, 0, 0
                    if h > 0:
                        extra_roll = random.random()
                        if extra_roll > 0.85:
                            hr = 1
                        elif extra_roll > 0.70:
                            doubles = 1
                        elif extra_roll > 0.65:
                            triples = 1
                            
                    rbi = random.randint(0, max(1, h + hr))
                    r = random.randint(0, max(1, h))
                    bb = random.randint(0, 2)
                    so = random.randint(0, 2)
                    
                    StatsBatting.objects.create(
                        game=game,
                        team=home_team,
                        player=player,
                        position=random.choice(POSICIONES),
                        pa=ab + bb,
                        ab=ab,
                        r=r,
                        h=h,
                        doubles=doubles,
                        triples=triples,
                        hr=hr,
                        rbi=rbi,
                        bb=bb,
                        so=so
                    )
                
                # Bateadores del equipo Visitante
                for player in random.sample(away_players, min(5, len(away_players))):
                    ab = random.randint(2, 5)
                    h = random.randint(0, ab)
                    
                    # Distribuir extrabases
                    doubles, triples, hr = 0, 0, 0
                    if h > 0:
                        extra_roll = random.random()
                        if extra_roll > 0.85:
                            hr = 1
                        elif extra_roll > 0.70:
                            doubles = 1
                        elif extra_roll > 0.65:
                            triples = 1
                            
                    rbi = random.randint(0, max(1, h + hr))
                    r = random.randint(0, max(1, h))
                    bb = random.randint(0, 2)
                    so = random.randint(0, 2)
                    
                    StatsBatting.objects.create(
                        game=game,
                        team=away_team,
                        player=player,
                        position=random.choice(POSICIONES),
                        pa=ab + bb,
                        ab=ab,
                        r=r,
                        h=h,
                        doubles=doubles,
                        triples=triples,
                        hr=hr,
                        rbi=rbi,
                        bb=bb,
                        so=so
                    )
                
                # 6. Simular estadísticas de Lanzamiento (1 pitcher por equipo)
                # Pitcher Local
                home_pitcher = random.choice(home_players)
                ip_outs = random.randint(3, 15)  # 1 a 5 entradas
                h_allowed = random.randint(0, 5)
                r_allowed = random.randint(0, 4)
                er_allowed = random.randint(0, r_allowed)
                bb_allowed = random.randint(0, 3)
                so_pitcher = random.randint(0, 6)
                
                is_win = home_score > away_score
                is_loss = away_score > home_score
                
                pitching_obj_home = StatsPitching(
                    game=game,
                    team=home_team,
                    player=home_pitcher,
                    is_starter=True,
                    win=is_win,
                    loss=is_loss,
                    ip_outs=ip_outs,
                    h=h_allowed,
                    r=r_allowed,
                    er=er_allowed,
                    bb=bb_allowed,
                    so=so_pitcher
                )
                StatsPitching.objects.bulk_create([pitching_obj_home])
                
                # Registrar decisiones en el juego
                if is_win:
                    game.winning_pitcher = home_pitcher
                if is_loss:
                    game.losing_pitcher = home_pitcher
                
                # Pitcher Visitante
                away_pitcher = random.choice(away_players)
                ip_outs_away = random.randint(3, 15)
                h_allowed_away = random.randint(0, 5)
                r_allowed_away = random.randint(0, 4)
                er_allowed_away = random.randint(0, r_allowed_away)
                bb_allowed_away = random.randint(0, 3)
                so_pitcher_away = random.randint(0, 6)
                
                is_win_away = away_score > home_score
                is_loss_away = home_score > away_score
                
                pitching_obj_away = StatsPitching(
                    game=game,
                    team=away_team,
                    player=away_pitcher,
                    is_starter=True,
                    win=is_win_away,
                    loss=is_loss_away,
                    ip_outs=ip_outs_away,
                    h=h_allowed_away,
                    r=r_allowed_away,
                    er=er_allowed_away,
                    bb=bb_allowed_away,
                    so=so_pitcher_away
                )
                StatsPitching.objects.bulk_create([pitching_obj_away])
                
                if is_win_away:
                    game.winning_pitcher = away_pitcher
                if is_loss_away:
                    game.losing_pitcher = away_pitcher
                
                game.save()
                
                simulated_games_count += 1
                print(f"  [Juego #{simulated_games_count}] {away_team.name} {away_score} - {home_score} {home_team.name} (Cat: {category.name}) en {stadium.name}")
                
        print(f"\n[OK] Simulacion completada con exito. Se simularon {simulated_games_count} juegos y estadisticas asociadas.")
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    simulate()
