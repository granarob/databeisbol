from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


# ===========================================================
# 1. GESTIÓN DE USUARIOS Y SEGURIDAD
# ===========================================================

class UserManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError('El username (correo) es obligatorio')
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault('role', 'super_admin')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(username, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        SUPER_ADMIN   = 'super_admin',   'Super Administrador'
        LEAGUE_ADMIN  = 'league_admin',  'Administrador de Liga'
        VIEWER        = 'viewer',        'Espectador'

    username    = models.EmailField(unique=True, verbose_name='Correo electrónico')
    full_name   = models.CharField(max_length=150)
    role        = models.CharField(max_length=20, choices=Role.choices, default=Role.VIEWER)
    is_active   = models.BooleanField(default=True)
    is_staff    = models.BooleanField(default=False)
    created_at  = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD  = 'username'
    REQUIRED_FIELDS = ['full_name']

    class Meta:
        db_table = 'users'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        return f'{self.full_name} ({self.get_role_display()})'


# ===========================================================
# 2. ESTRUCTURA ORGANIZACIONAL (Ligas, Temporadas, Equipos)
# ===========================================================

class League(models.Model):
    name        = models.CharField(max_length=100, verbose_name='Nombre de la liga')
    country     = models.CharField(max_length=50, default='Venezuela')
    city        = models.CharField(max_length=100, blank=True)
    logo_url    = models.URLField(blank=True)
    admin       = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='leagues_managed', verbose_name='Administrador'
    )
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'leagues'
        verbose_name = 'Liga'
        verbose_name_plural = 'Ligas'

    def __str__(self):
        return self.name


class Season(models.Model):
    league      = models.ForeignKey(League, on_delete=models.CASCADE, related_name='seasons')
    name        = models.CharField(max_length=100, verbose_name='Nombre', help_text='Ej: Temporada 2025-2026')
    start_date  = models.DateField(verbose_name='Inicio')
    end_date    = models.DateField(verbose_name='Fin')
    is_active   = models.BooleanField(default=False)

    class Meta:
        db_table = 'seasons'
        verbose_name = 'Temporada'
        verbose_name_plural = 'Temporadas'

    def __str__(self):
        return f'{self.league} — {self.name}'


class Category(models.Model):
    league      = models.ForeignKey(League, on_delete=models.CASCADE, related_name='categories')
    name        = models.CharField(max_length=100, verbose_name='División', help_text='Ej: Semillita, Pre-Infantil, Juvenil')
    age_min     = models.PositiveSmallIntegerField(verbose_name='Edad mínima')
    age_max     = models.PositiveSmallIntegerField(verbose_name='Edad máxima')

    class Meta:
        db_table = 'categories'
        verbose_name = 'Categoría'
        verbose_name_plural = 'Categorías'

    def __str__(self):
        return f'{self.name} ({self.age_min}-{self.age_max} años) — {self.league}'


class Team(models.Model):
    category    = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='teams')
    season      = models.ForeignKey(Season, on_delete=models.CASCADE, related_name='teams')
    name        = models.CharField(max_length=100, verbose_name='Nombre del equipo')
    short_name  = models.CharField(max_length=10, verbose_name='Abreviatura', help_text='Ej: MAG')
    logo_url    = models.URLField(blank=True)
    manager_name = models.CharField(max_length=100, blank=True, verbose_name='Director técnico')
    # Cache de tabla de posiciones
    won         = models.PositiveSmallIntegerField(default=0, verbose_name='Ganados')
    lost        = models.PositiveSmallIntegerField(default=0, verbose_name='Perdidos')
    tied        = models.PositiveSmallIntegerField(default=0, verbose_name='Empatados')

    class Meta:
        db_table = 'teams'
        verbose_name = 'Equipo'
        verbose_name_plural = 'Equipos'

    def __str__(self):
        return f'{self.name} ({self.short_name})'


# ===========================================================
# 3. JUGADORES Y ROSTERS (Histórico)
# ===========================================================

class Player(models.Model):
    class BatsHand(models.TextChoices):
        RIGHT  = 'R', 'Derecho'
        LEFT   = 'L', 'Zurdo'
        SWITCH = 'S', 'Ambos'

    class ThrowsHand(models.TextChoices):
        RIGHT = 'R', 'Derecho'
        LEFT  = 'L', 'Zurdo'

    first_name   = models.CharField(max_length=100, verbose_name='Nombre')
    last_name    = models.CharField(max_length=100, verbose_name='Apellido')
    birth_date   = models.DateField(verbose_name='Fecha de nacimiento')
    height_cm    = models.PositiveSmallIntegerField(null=True, blank=True, verbose_name='Altura (cm)')
    weight_kg    = models.PositiveSmallIntegerField(null=True, blank=True, verbose_name='Peso (kg)')
    bats_hand    = models.CharField(max_length=1, choices=BatsHand.choices, verbose_name='Batea')
    throws_hand  = models.CharField(max_length=1, choices=ThrowsHand.choices, verbose_name='Lanza')
    bio          = models.TextField(blank=True, verbose_name='Biografía')
    photo_url    = models.URLField(blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'players'
        verbose_name = 'Jugador'
        verbose_name_plural = 'Jugadores'
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f'{self.first_name} {self.last_name}'


class Roster(models.Model):
    """
    Tabla pivote histórica: asigna un jugador a un equipo por temporada.
    Permite que el jugador cambie de equipo sin perder su historial.
    """
    team         = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='rosters')
    player       = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='rosters')
    jersey_number = models.PositiveSmallIntegerField(verbose_name='Número de dorsal')
    is_active    = models.BooleanField(default=True)

    class Meta:
        db_table = 'rosters'
        verbose_name = 'Roster'
        verbose_name_plural = 'Rosters'
        unique_together = [('team', 'player')]

    def __str__(self):
        return f'#{self.jersey_number} {self.player} — {self.team}'


# ===========================================================
# 4. CALENDARIO Y JUEGOS
# ===========================================================

class Stadium(models.Model):
    name     = models.CharField(max_length=150, verbose_name='Nombre del estadio')
    location = models.CharField(max_length=200, blank=True, verbose_name='Ubicación')

    class Meta:
        db_table = 'stadiums'
        verbose_name = 'Estadio'
        verbose_name_plural = 'Estadios'

    def __str__(self):
        return self.name


class Game(models.Model):
    class Status(models.TextChoices):
        SCHEDULED  = 'scheduled',  'Programado'
        LIVE       = 'live',       'En progreso'
        FINISHED   = 'finished',   'Finalizado'
        SUSPENDED  = 'suspended',  'Suspendido'
        POSTPONED  = 'postponed',  'Pospuesto'

    season       = models.ForeignKey(Season, on_delete=models.CASCADE, related_name='games')
    category     = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='games')
    home_team    = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='home_games', verbose_name='Equipo local')
    away_team    = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='away_games', verbose_name='Equipo visitante')
    stadium      = models.ForeignKey(Stadium, on_delete=models.SET_NULL, null=True, blank=True, related_name='games')
    game_date    = models.DateTimeField(verbose_name='Fecha y hora')
    status       = models.CharField(max_length=15, choices=Status.choices, default=Status.SCHEDULED)

    # Cache del marcador (evita recalcular desde stats cada vez)
    home_score   = models.PositiveSmallIntegerField(default=0, verbose_name='Carreras local')
    away_score   = models.PositiveSmallIntegerField(default=0, verbose_name='Carreras visitante')

    # Decisiones de pitcheo
    winning_pitcher = models.ForeignKey(
        Player, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='wins', verbose_name='Pitcher ganador'
    )
    losing_pitcher = models.ForeignKey(
        Player, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='losses', verbose_name='Pitcher perdedor'
    )
    save_pitcher = models.ForeignKey(
        Player, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='saves', verbose_name='Pitcher salvado'
    )

    class Meta:
        db_table = 'games'
        verbose_name = 'Juego'
        verbose_name_plural = 'Juegos'
        ordering = ['-game_date']

    def __str__(self):
        return f'{self.away_team.short_name} @ {self.home_team.short_name} — {self.game_date:%d/%m/%Y}'


# ===========================================================
# 5. ESTADÍSTICAS DETALLADAS (Box Scores)
# ===========================================================

class StatsBatting(models.Model):
    """
    Estadísticas de bateo por juego por jugador.
    Es la fuente de la verdad para cálculos y comparaciones.
    """
    game    = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='batting_stats')
    team    = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='batting_stats')
    player  = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='batting_stats')

    # Posición jugada
    POSITION_CHOICES = [
        ('P',  'Pitcher'), ('C',  'Catcher'), ('1B', 'Primera base'),
        ('2B', 'Segunda base'), ('3B', 'Tercera base'), ('SS', 'Shortstop'),
        ('LF', 'Left Field'), ('CF', 'Center Field'), ('RF', 'Right Field'),
        ('DH', 'Designado'), ('PH', 'Pinch Hitter'), ('PR', 'Pinch Runner'), 
        ('UT', 'Utility')
    ]
    position = models.CharField(max_length=2, choices=POSITION_CHOICES, blank=True, null=True, verbose_name='Posición jugada')

    # Métricas raw
    pa      = models.PositiveSmallIntegerField(default=0, verbose_name='Apariciones al plato (PA)')
    ab      = models.PositiveSmallIntegerField(default=0, verbose_name='Turnos al bate (AB)')
    r       = models.PositiveSmallIntegerField(default=0, verbose_name='Carreras (R)')
    h       = models.PositiveSmallIntegerField(default=0, verbose_name='Hits (H)')
    doubles = models.PositiveSmallIntegerField(default=0, verbose_name='Dobles (2B)')
    triples = models.PositiveSmallIntegerField(default=0, verbose_name='Triples (3B)')
    hr      = models.PositiveSmallIntegerField(default=0, verbose_name='Jonrones (HR)')
    rbi     = models.PositiveSmallIntegerField(default=0, verbose_name='Carreras impulsadas (RBI)')
    bb      = models.PositiveSmallIntegerField(default=0, verbose_name='Bases por bolas (BB)')
    so      = models.PositiveSmallIntegerField(default=0, verbose_name='Ponches (SO/K)')
    sb      = models.PositiveSmallIntegerField(default=0, verbose_name='Bases robadas (SB)')
    cs      = models.PositiveSmallIntegerField(default=0, verbose_name='Capturado en robo (CS)')
    hbp     = models.PositiveSmallIntegerField(default=0, verbose_name='Golpeado por lanzador (HBP)')
    sf      = models.PositiveSmallIntegerField(default=0, verbose_name='Sacrificios fly (SF)')
    sh      = models.PositiveSmallIntegerField(default=0, verbose_name='Sacrificios hit/toque (SH)')
    ibb     = models.PositiveSmallIntegerField(default=0, verbose_name='Boletos intencionales (IBB/I)')

    created_at = models.DateTimeField(auto_now_add=True)

    # -------------------------------------------------------
    # Promedios calculados (propiedades, no columnas en BD)
    # -------------------------------------------------------
    @property
    def avg(self):
        """Promedio de bateo: H / AB"""
        return round(self.h / self.ab, 3) if self.ab > 0 else 0.000

    @property
    def obp(self):
        """On-base percentage: (H + BB + IBB + HBP) / (AB + BB + IBB + HBP + SF)"""
        denom = self.ab + self.bb + self.ibb + self.hbp + self.sf
        return round((self.h + self.bb + self.ibb + self.hbp) / denom, 3) if denom > 0 else 0.000

    @property
    def slg(self):
        """Slugging: (H + 2B + 2*3B + 3*HR) / AB"""
        total_bases = self.h + self.doubles + (2 * self.triples) + (3 * self.hr)
        return round(total_bases / self.ab, 3) if self.ab > 0 else 0.000

    @property
    def ops(self):
        """OBP + SLG"""
        return round(self.obp + self.slg, 3)

    class Meta:
        db_table = 'stats_batting'
        verbose_name = 'Estadística de bateo'
        verbose_name_plural = 'Estadísticas de bateo'
        unique_together = [('game', 'player')]

    def __str__(self):
        return f'{self.player} vs {self.game} — {self.h}/{self.ab}'


class StatsPitching(models.Model):
    """
    Estadísticas de pitcheo por juego por jugador.
    ip_outs almacena los innings como OUTS totales para precisión matemática.
    Ej: 1.1 innings = 4 outs | 2.2 innings = 8 outs | 3 innings = 9 outs
    """
    class Decision(models.TextChoices):
        WIN  = 'win',  'Victoria (W)'
        LOSS = 'loss', 'Derrota (L)'
        SAVE = 'save', 'Salvado (S)'
        HOLD = 'hold', 'Hold (H)'

    game    = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='pitching_stats')
    team    = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='pitching_stats')
    player  = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='pitching_stats')

    # Identificadores de rol y decisión
    is_starter      = models.BooleanField(default=False, verbose_name='Abridor (I)')
    is_reliever     = models.BooleanField(default=False, verbose_name='Relevista (R)')
    complete_game   = models.BooleanField(default=False, verbose_name='Juego Completo (C)')
    
    win             = models.BooleanField(default=False, verbose_name='Ganado (G)')
    loss            = models.BooleanField(default=False, verbose_name='Perdido (P)')
    save            = models.BooleanField(default=False, verbose_name='Salvado (S)')

    # Métricas raw
    ab_against = models.PositiveSmallIntegerField(default=0, verbose_name='Veces al bate (VB)')
    ip_outs    = models.PositiveSmallIntegerField(default=0, verbose_name='Outs lanzados (IP×3)')
    h          = models.PositiveSmallIntegerField(default=0, verbose_name='Hits (HP)')
    r          = models.PositiveSmallIntegerField(default=0, verbose_name='Carreras (CP)')
    er         = models.PositiveSmallIntegerField(default=0, verbose_name='Carreras limpias (CL)')
    bb         = models.PositiveSmallIntegerField(default=0, verbose_name='Boletos (BB)')
    so         = models.PositiveSmallIntegerField(default=0, verbose_name='Ponches (K)')
    
    h2_allowed = models.PositiveSmallIntegerField(default=0, verbose_name='Dobles (H2)')
    h3_allowed = models.PositiveSmallIntegerField(default=0, verbose_name='Triples (H3)')
    hr         = models.PositiveSmallIntegerField(default=0, verbose_name='Jonrones (HR)')
    
    sh_allowed = models.PositiveSmallIntegerField(default=0, verbose_name='Sacrificios toque (SH)')
    sf_allowed = models.PositiveSmallIntegerField(default=0, verbose_name='Sacrificios fly (SF)')
    hbp        = models.PositiveSmallIntegerField(default=0, verbose_name='Golpeados (GP)')
    
    pitch_count = models.PositiveIntegerField(default=0, verbose_name='Lanzamientos (LZ)')

    # Otros (compatibilidad anterior)
    wp         = models.PositiveSmallIntegerField(default=0, verbose_name='Wild Pitch (WP)')
    bk         = models.PositiveSmallIntegerField(default=0, verbose_name='Balks (BK)')

    decision = models.CharField(
        max_length=4, choices=Decision.choices,
        null=True, blank=True, verbose_name='Decisión (Legacy)'
    )

    # -------------------------------------------------------
    # Promedios calculados (propiedades, no columnas en BD)
    # -------------------------------------------------------
    @property
    def ip_display(self):
        """Muestra los innings lanzados en formato estándar (Ej: 4 outs → 1.1)"""
        full_innings = self.ip_outs // 3
        remaining_outs = self.ip_outs % 3
        return f'{full_innings}.{remaining_outs}'

    @property
    def era(self):
        """Efectividad: (ER × 27) / ip_outs  (27 = 9 innings × 3 outs)"""
        return round((self.er * 27) / self.ip_outs, 2) if self.ip_outs > 0 else 0.00

    @property
    def whip(self):
        """WHIP: (BB + H) / (ip_outs / 3)"""
        innings = self.ip_outs / 3
        return round((self.bb + self.h) / innings, 2) if innings > 0 else 0.00

    class Meta:
        db_table = 'stats_pitching'
        verbose_name = 'Estadística de pitcheo'
        verbose_name_plural = 'Estadísticas de pitcheo'
        unique_together = [('game', 'player')]

    def __str__(self):
        return f'{self.player} vs {self.game} — {self.ip_display} IP, {self.er} CL'
