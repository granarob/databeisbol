from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import (
    User, League, Season, Category,
    Team, Player, Roster,
    Stadium, Game,
    StatsBatting, StatsPitching,
)


# ===========================================================
# AUTH
# ===========================================================

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['id', 'username', 'full_name', 'role', 'is_active', 'created_at']
        read_only_fields = ['created_at']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])

    class Meta:
        model  = User
        fields = ['username', 'full_name', 'role', 'password']

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


# ===========================================================
# ESTRUCTURA ORGANIZACIONAL
# ===========================================================

class LeagueSerializer(serializers.ModelSerializer):
    admin_name = serializers.CharField(source='admin.full_name', read_only=True)

    class Meta:
        model  = League
        fields = ['id', 'name', 'country', 'city', 'logo_url', 'admin', 'admin_name', 'created_at']
        read_only_fields = ['created_at']


class SeasonSerializer(serializers.ModelSerializer):
    league_name = serializers.CharField(source='league.name', read_only=True)

    class Meta:
        model  = Season
        fields = ['id', 'league', 'league_name', 'name', 'start_date', 'end_date', 'is_active']


class CategorySerializer(serializers.ModelSerializer):
    league_name = serializers.CharField(source='league.name', read_only=True)

    class Meta:
        model  = Category
        fields = ['id', 'league', 'league_name', 'name', 'age_min', 'age_max']


class TeamSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    season_name   = serializers.CharField(source='season.name', read_only=True)

    class Meta:
        model  = Team
        fields = [
            'id', 'name', 'short_name', 'logo_url', 'manager_name',
            'category', 'category_name', 'season', 'season_name',
            'won', 'lost', 'tied',
        ]


# ===========================================================
# JUGADORES
# ===========================================================

class PlayerSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    age       = serializers.SerializerMethodField()

    class Meta:
        model  = Player
        fields = [
            'id', 'first_name', 'last_name', 'full_name',
            'birth_date', 'age', 'height_cm', 'weight_kg',
            'bats_hand', 'throws_hand', 'bio', 'photo_url', 'created_at',
        ]
        read_only_fields = ['created_at']

    def get_full_name(self, obj):
        return f'{obj.first_name} {obj.last_name}'

    def get_age(self, obj):
        from datetime import date
        today = date.today()
        return today.year - obj.birth_date.year - (
            (today.month, today.day) < (obj.birth_date.month, obj.birth_date.day)
        )


class RosterSerializer(serializers.ModelSerializer):
    player_name  = serializers.CharField(source='player.__str__', read_only=True)
    team_name    = serializers.CharField(source='team.name', read_only=True)

    class Meta:
        model  = Roster
        fields = ['id', 'team', 'team_name', 'player', 'player_name', 'jersey_number', 'position', 'is_active']


# ===========================================================
# ESTADIOS Y JUEGOS
# ===========================================================

class StadiumSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Stadium
        fields = ['id', 'name', 'location']


class GameSerializer(serializers.ModelSerializer):
    home_team_name = serializers.CharField(source='home_team.name', read_only=True)
    away_team_name = serializers.CharField(source='away_team.name', read_only=True)
    stadium_name   = serializers.CharField(source='stadium.name', read_only=True)
    category_name  = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model  = Game
        fields = [
            'id', 'season', 'category', 'category_name',
            'home_team', 'home_team_name', 'away_team', 'away_team_name',
            'stadium', 'stadium_name', 'game_date', 'status',
            'home_score', 'away_score',
            'winning_pitcher', 'losing_pitcher', 'save_pitcher',
        ]


class GameStatusSerializer(serializers.ModelSerializer):
    """Solo para actualizar el estado de un juego (PATCH)."""
    class Meta:
        model  = Game
        fields = ['status']


# ===========================================================
# ESTADÍSTICAS — BATEO
# ===========================================================

class StatsBattingSerializer(serializers.ModelSerializer):
    player_name = serializers.CharField(source='player.__str__', read_only=True)
    # Promedios calculados (solo lectura)
    avg = serializers.FloatField(source='avg', read_only=True)
    obp = serializers.FloatField(source='obp', read_only=True)
    slg = serializers.FloatField(source='slg', read_only=True)
    ops = serializers.FloatField(source='ops', read_only=True)

    class Meta:
        model  = StatsBatting
        fields = [
            'id', 'game', 'team', 'player', 'player_name',
            'pa', 'ab', 'r', 'h', 'doubles', 'triples', 'hr',
            'rbi', 'bb', 'so', 'sb', 'cs', 'hbp', 'sf',
            'avg', 'obp', 'slg', 'ops',
            'created_at',
        ]
        read_only_fields = ['created_at']


# ===========================================================
# ESTADÍSTICAS — PITCHEO
# ===========================================================

class StatsPitchingSerializer(serializers.ModelSerializer):
    player_name = serializers.CharField(source='player.__str__', read_only=True)
    # Promedios calculados (solo lectura)
    ip_display = serializers.CharField(source='ip_display', read_only=True)
    era        = serializers.FloatField(source='era', read_only=True)
    whip       = serializers.FloatField(source='whip', read_only=True)

    class Meta:
        model  = StatsPitching
        fields = [
            'id', 'game', 'team', 'player', 'player_name',
            'ip_outs', 'ip_display', 'h', 'r', 'er', 'bb', 'so',
            'hr', 'wp', 'bk', 'hbp', 'decision',
            'era', 'whip',
        ]


# ===========================================================
# SERIALIZADORES DE PERFIL COMPLETO (para endpoints de lectura)
# ===========================================================

class PlayerProfileSerializer(PlayerSerializer):
    """Perfil completo del jugador con rosters embebidos."""
    rosters = RosterSerializer(many=True, read_only=True)

    class Meta(PlayerSerializer.Meta):
        fields = PlayerSerializer.Meta.fields + ['rosters']  # type: ignore


class TeamDetailSerializer(TeamSerializer):
    """Detalle de equipo con roster completo."""
    rosters = RosterSerializer(many=True, read_only=True)

    class Meta(TeamSerializer.Meta):
        fields = TeamSerializer.Meta.fields + ['rosters']  # type: ignore
