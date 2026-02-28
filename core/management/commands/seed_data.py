"""
Management command para cargar datos de muestra de béisbol venezolano.
Uso: python manage.py seed_data

Enriquecido para Fase 2.1+: +40 jugadores, +10 juegos, stats variadas.
"""

import random
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from datetime import date, timedelta
from core.models import (
    User, League, Season, Category, Team, Player,
    Roster, Stadium, Game, StatsBatting, StatsPitching
)

class Command(BaseCommand):
    help = 'Carga datos de muestra avanzados (40+ jugadores, 10+ juegos) para desarrollo local'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING('⚾  Cargando datos de muestra AVANZADOS — BeisbolData'))

        # ── 1. Superusuario admin ─────────────────────────────────────
        admin_user, _ = User.objects.get_or_create(
            username='admin@beisboldata.com',
            defaults={
                'role': 'super_admin',
                'full_name': 'Administrador Global',
                'is_staff': True,
                'is_superuser': True
            }
        )
        admin_user.set_password('Admin1234!')
        admin_user.save()
        self.stdout.write(self.style.SUCCESS('  ✓ Superusuario listo: admin@beisboldata.com / Admin1234!'))

        # ── 2. Liga ───────────────────────────────────────────────────
        liga, _ = League.objects.get_or_create(
            name='Liga Semillita Caracas',
            defaults=dict(country='Venezuela', city='Caracas'),
        )
        self.stdout.write(self.style.SUCCESS(f'  ✓ Liga: {liga.name}'))

        # ── 3. Temporada ──────────────────────────────────────────────
        season, _ = Season.objects.get_or_create(
            league=liga, name='Temporada 2025-2026',
            defaults=dict(start_date=date(2025, 10, 1), end_date=date(2026, 4, 30), is_active=True),
        )
        self.stdout.write(self.style.SUCCESS(f'  ✓ Temporada: {season.name}'))

        # ── 4. Categorías ─────────────────────────────────────────────
        semillita, _ = Category.objects.get_or_create(
            league=liga, name='Semillita',
            defaults=dict(age_min=7, age_max=10),
        )
        prebeis, _ = Category.objects.get_or_create(
            league=liga, name='Prebeis',
            defaults=dict(age_min=11, age_max=12),
        )
        self.stdout.write(self.style.SUCCESS('  ✓ Categorías: Semillita, Prebeis'))

        # ── 5. Estadios ───────────────────────────────────────────────
        stadiums = []
        for name in ['Estadio Universitario', 'Polideportivo Chacao', 'Campo Las Marías', 'Estadio La Planicie']:
            s, _ = Stadium.objects.get_or_create(name=name, defaults={'location': 'Caracas, Venezuela'})
            stadiums.append(s)

        # ── 6. Equipos ────────────────────────────────────────────────
        teams_data = [
            ('Cardenales del Paraíso', 'CAR', semillita),
            ('Tiburones de La Pastora', 'TIB', semillita),
            ('Águilas de Catia',        'AGU', prebeis),
            ('Leones del Valle',        'LEO', prebeis),
        ]
        teams = []
        for name, short, cat in teams_data:
            t, _ = Team.objects.get_or_create(
                name=name, season=season, category=cat,
                defaults=dict(short_name=short),
            )
            teams.append(t)
        self.stdout.write(self.style.SUCCESS(f'  ✓ {len(teams)} equipos listos'))

        # ── 7. Jugadores (Generación Masiva) ─────────────────────────
        first_names = [
            'Carlos', 'Miguel', 'Andrés', 'José', 'Pedro', 'Luis', 'Daniel', 'Roberto', 
            'Sebastián', 'Felipe', 'Jorge', 'Ángel', 'Kevin', 'Bryan', 'Yhonatan', 
            'Marcos', 'Emilio', 'Cristian', 'Simón', 'Reinaldo', 'Samuel', 'Diego', 
            'Alejandro', 'Gabriel', 'Santiago', 'Mateo', 'Javier', 'Rafael', 'Juan', 'Tomas'
        ]
        last_names = [
            'Rodríguez', 'Pérez', 'González', 'Martínez', 'López', 'Hernández', 'Ramírez', 
            'Torres', 'Castro', 'Morales', 'Suárez', 'Díaz', 'Vargas', 'Reyes', 'Flores', 
            'Jiménez', 'Blanco', 'Muñoz', 'Pinto', 'Ochoa', 'Sánchez', 'Chávez', 'Aular', 
            'Ramos', 'García', 'Mendoza', 'Soto', 'Acosta', 'Colmenares', 'Figueroa'
        ]
        positions = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'P']
        
        # Eliminar rosters anteriores para un seed limpio
        Roster.objects.all().delete()
        
        all_players = []
        player_idx = 0
        for team in teams:
            # Crear 12 jugadores por equipo (48 total)
            for i in range(12):
                fn = random.choice(first_names)
                ln = random.choice(last_names)
                bd = date(2013 if team.category == prebeis else 2017, random.randint(1,12), random.randint(1,28))
                
                # Para evitar duplicados exactos nombre+apellido
                p, created = Player.objects.get_or_create(
                    first_name=fn, last_name=ln,
                    defaults={
                        'birth_date': bd,
                        'bats_hand': random.choice(['R', 'L', 'S']),
                        'throws_hand': random.choice(['R', 'L'])
                    }
                )
                
                Roster.objects.create(
                    team=team, 
                    player=p,
                    jersey_number=random.randint(1, 99),
                    position=positions[i % 9],
                    is_active=True
                )
                all_players.append(p)
                player_idx += 1
        
        self.stdout.write(self.style.SUCCESS(f'  ✓ {len(all_players)} jugadores registrados'))

        # ── 8. Juegos (Simulación de Temporada) ───────────────────────
        Game.objects.all().delete() # Limpiar juegos para el seed avanzado
        
        finished_games = []
        # Crear 12 juegos finalizados
        for i in range(12):
            # Elegir categoría y equipos
            cat = random.choice([semillita, prebeis])
            cat_teams = [t for t in teams if t.category == cat]
            t_home, t_away = random.sample(cat_teams, 2)
            
            score_home = random.randint(0, 10)
            score_away = random.randint(0, 10)
            if score_home == score_away: score_home += 1 # No empates en el seed para simplicidad
            
            g = Game.objects.create(
                home_team=t_home, away_team=t_away,
                season=season, category=cat,
                stadium=random.choice(stadiums),
                game_date=timezone.now() - timedelta(days=random.randint(1, 20)),
                status='finished',
                home_score=score_home,
                away_score=score_away
            )
            finished_games.append(g)

        self.stdout.write(self.style.SUCCESS('  ✓ 12 juegos finalizados creados'))

        # ── 9. Estadísticas (Randomización Realista) ─────────────────
        StatsBatting.objects.all().delete()
        StatsPitching.objects.all().delete()

        for g in finished_games:
            # Para cada equipo en el juego, crear stats de bateo para sus jugadores
            for team in [g.home_team, g.away_team]:
                roster = Roster.objects.filter(team=team)
                
                # Pitcheo: Elegir un pitcher para el juego
                p_pitcher = roster.filter(position='P').first()
                if not p_pitcher: p_pitcher = roster.first() # Safe backup
                
                win_loss = 'win' if (team == g.home_team and g.home_score > g.away_score) or (team == g.away_team and g.away_score > g.home_score) else 'loss'
                
                StatsPitching.objects.create(
                    game=g, team=team, player=p_pitcher.player,
                    ip_outs=18, # 6 innings
                    h=random.randint(2, 8),
                    r=random.randint(0, 5),
                    er=random.randint(0, 5),
                    bb=random.randint(0, 3),
                    so=random.randint(3, 10),
                    hr=random.randint(0, 2),
                    decision=win_loss
                )

                # Bateo: Todos los jugadores del roster en el juego
                for member in roster:
                    ab = random.randint(2, 5)
                    h = random.randint(0, ab)
                    bb = random.randint(0, 2)
                    StatsBatting.objects.create(
                        game=g, team=team, player=member.player,
                        pa=ab + bb, ab=ab, h=h,
                        r=random.randint(0, 2),
                        doubles=random.randint(0, 1) if h > 0 else 0,
                        hr=random.randint(0, 1) if h > 0 else 0,
                        rbi=random.randint(0, 3),
                        bb=bb,
                        so=random.randint(0, 2),
                        sb=random.randint(0, 1)
                    )

        self.stdout.write(self.style.SUCCESS('  ✓ Estadísticas masivas generadas para todos los juegos'))

        # ── 10. Actualizar Standings ─────────────────────────────────
        for g in finished_games:
            g.save() # Dispara signals para actualizar puntos en Team
        
        self.stdout.write(self.style.SUCCESS('\n🎉 ¡Base de datos enriquecida con éxito!'))
        self.stdout.write('   Use http://localhost:3000/comparar para probar las nuevas comparativas.')
