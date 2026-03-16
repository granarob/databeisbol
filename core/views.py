from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.utils import timezone
from datetime import timedelta
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from django.core.cache import cache
from django.db.models import Sum, Avg, F, FloatField, ExpressionWrapper, Count, Q


from .models import (
    User, League, Season, Category,
    Team, Player, Roster,
    Stadium, Game,
    StatsBatting, StatsPitching,
)
from .serializers import (
    UserSerializer, RegisterSerializer,
    LeagueSerializer, SeasonSerializer, CategorySerializer,
    TeamSerializer, TeamDetailSerializer,
    PlayerSerializer, PlayerProfileSerializer, RosterSerializer,
    StadiumSerializer,
    GameSerializer, GameStatusSerializer,
    StatsBattingSerializer, StatsPitchingSerializer,
)
from .permissions import (
    IsAdminOrReadOnly,
    IsSuperAdmin,
    IsLeagueAdminOrSuperAdmin,
    IsLeagueOwnerOrSuperAdmin,
)


# ===========================================================
# AUTH
# ===========================================================

class RegisterView(APIView):
    """Solo super_admin puede crear usuarios."""
    permission_classes = [IsSuperAdmin]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    """Devuelve el usuario autenticado actual."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


# ===========================================================
# USUARIOS
# ===========================================================

class UserViewSet(viewsets.ModelViewSet):
    queryset           = User.objects.all().order_by('full_name')
    serializer_class   = UserSerializer
    permission_classes = [IsSuperAdmin]
    filter_backends    = [filters.SearchFilter]
    search_fields      = ['username', 'full_name']


# ===========================================================
# ESTRUCTURA ORGANIZACIONAL
# ===========================================================

class LeagueViewSet(viewsets.ModelViewSet):
    queryset           = League.objects.all().order_by('name')
    serializer_class   = LeagueSerializer
    permission_classes = [IsAdminOrReadOnly, IsLeagueOwnerOrSuperAdmin]
    filter_backends    = [filters.SearchFilter]
    search_fields      = ['name', 'city']


class SeasonViewSet(viewsets.ModelViewSet):
    queryset           = Season.objects.all().order_by('-start_date')
    serializer_class   = SeasonSerializer
    permission_classes = [IsAdminOrReadOnly, IsLeagueOwnerOrSuperAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        league_id = self.request.query_params.get('league')
        if league_id:
            qs = qs.filter(league_id=league_id)
        return qs


class CategoryViewSet(viewsets.ModelViewSet):
    queryset           = Category.objects.all().order_by('name')
    serializer_class   = CategorySerializer
    permission_classes = [IsAdminOrReadOnly, IsLeagueOwnerOrSuperAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        league_id = self.request.query_params.get('league')
        if league_id:
            qs = qs.filter(league_id=league_id)
        return qs


class TeamViewSet(viewsets.ModelViewSet):
    queryset           = Team.objects.select_related('category', 'season').order_by('name')
    serializer_class   = TeamSerializer
    permission_classes = [IsAdminOrReadOnly, IsLeagueOwnerOrSuperAdmin]
    filter_backends    = [filters.SearchFilter]
    search_fields      = ['name', 'short_name']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TeamDetailSerializer
        return TeamSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        season_id   = self.request.query_params.get('season')
        category_id = self.request.query_params.get('category')
        if season_id:
            qs = qs.filter(season_id=season_id)
        if category_id:
            qs = qs.filter(category_id=category_id)
        return qs

    @action(detail=False, methods=['get'], url_path='standings')
    def standings(self, request):
        """
        GET /api/teams/standings/?season=<id>&category=<id>
        Devuelve la tabla de posiciones ordenada por victorias.
        """
        season_id   = request.query_params.get('season', '')
        category_id = request.query_params.get('category', '')
        
        cache_key = f"standings_{season_id}_{category_id}"
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        qs = self.get_queryset().order_by('-won', 'lost')
        serializer = TeamSerializer(qs, many=True)
        data = serializer.data
        cache.set(cache_key, data, timeout=3600)
        return Response(data)


# ===========================================================
# JUGADORES Y ROSTERS
# ===========================================================

class PlayerViewSet(viewsets.ModelViewSet):
    queryset           = Player.objects.all().order_by('last_name', 'first_name')
    serializer_class   = PlayerSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends    = [filters.SearchFilter]
    search_fields      = ['first_name', 'last_name']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PlayerProfileSerializer
        return PlayerSerializer

    @action(detail=True, methods=['get'], url_path='stats')
    def season_stats(self, request, pk=None):
        """
        GET /api/players/<id>/stats/?season=<id>
        Retorna stats acumuladas del jugador en la temporada indicada.
        """
        player    = self.get_object()
        season_id = request.query_params.get('season')

        batting_qs = StatsBatting.objects.filter(player=player)
        pitching_qs = StatsPitching.objects.filter(player=player)

        if season_id:
            batting_qs  = batting_qs.filter(game__season_id=season_id)
            pitching_qs = pitching_qs.filter(game__season_id=season_id)

        # Acumular stats de bateo
        batting_agg = batting_qs.aggregate(
            total_pa=Sum('pa'), total_ab=Sum('ab'), total_r=Sum('r'),
            total_h=Sum('h'), total_2b=Sum('doubles'), total_3b=Sum('triples'),
            total_hr=Sum('hr'), total_rbi=Sum('rbi'),
            total_bb=Sum('bb'), total_so=Sum('so'),
            total_sb=Sum('sb'), total_hbp=Sum('hbp'), total_sf=Sum('sf'),
        )

        # Calcular promedios acumulados
        ab  = batting_agg['total_ab'] or 0
        h   = batting_agg['total_h'] or 0
        bb  = batting_agg['total_bb'] or 0
        hbp = batting_agg['total_hbp'] or 0
        sf  = batting_agg['total_sf'] or 0
        _2b = batting_agg['total_2b'] or 0
        _3b = batting_agg['total_3b'] or 0
        hr  = batting_agg['total_hr'] or 0

        avg = round(h / ab, 3) if ab else 0.0
        denom_obp = ab + bb + hbp + sf
        obp = round((h + bb + hbp) / denom_obp, 3) if denom_obp else 0.0
        slg = round((h + _2b + 2 * _3b + 3 * hr) / ab, 3) if ab else 0.0

        batting_summary = {
            **{k: v or 0 for k, v in batting_agg.items()},
            'avg': avg, 'obp': obp, 'slg': slg, 'ops': round(obp + slg, 3),
        }

        # Acumular stats de pitcheo
        pitching_agg = pitching_qs.aggregate(
            total_ip_outs=Sum('ip_outs'), total_h=Sum('h'), total_r=Sum('r'),
            total_er=Sum('er'), total_bb=Sum('bb'), total_so=Sum('so'),
            total_hr=Sum('hr'), total_wp=Sum('wp'), total_bk=Sum('bk'),
        )

        ip_outs = pitching_agg['total_ip_outs'] or 0
        er      = pitching_agg['total_er'] or 0
        p_bb    = pitching_agg['total_bb'] or 0
        p_h     = pitching_agg['total_h'] or 0
        full_ip = ip_outs // 3
        rem_ip  = ip_outs % 3

        pitching_summary = {
            **{k: v or 0 for k, v in pitching_agg.items()},
            'ip_display': f'{full_ip}.{rem_ip}',
            'era':  round((er * 27) / ip_outs, 2) if ip_outs else 0.0,
            'whip': round((p_bb + p_h) / (ip_outs / 3), 2) if ip_outs else 0.0,
        }

        return Response({
            'player_id': player.pk,
            'player'   : f'{player.first_name} {player.last_name}',
            'batting'  : batting_summary,
            'pitching' : pitching_summary,
        })

    @action(detail=True, methods=['get'], url_path='gamelog')
    def game_log(self, request, pk=None):
        """
        GET /api/players/<id>/gamelog/?season=<id>
        Retorna el desglose juego a juego del jugador.
        """
        player    = self.get_object()
        season_id = request.query_params.get('season')

        batting  = StatsBatting.objects.filter(player=player).select_related('game', 'team')
        pitching = StatsPitching.objects.filter(player=player).select_related('game', 'team')

        if season_id:
            batting  = batting.filter(game__season_id=season_id)
            pitching = pitching.filter(game__season_id=season_id)

        return Response({
            'batting' : StatsBattingSerializer(batting, many=True).data,
            'pitching': StatsPitchingSerializer(pitching, many=True).data,
        })


class RosterViewSet(viewsets.ModelViewSet):
    queryset           = Roster.objects.select_related('player', 'team').all()
    serializer_class   = RosterSerializer
    permission_classes = [IsAdminOrReadOnly, IsLeagueOwnerOrSuperAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        team_id = self.request.query_params.get('team')
        if team_id:
            qs = qs.filter(team_id=team_id)
        return qs


# ===========================================================
# ESTADIOS Y JUEGOS
# ===========================================================

class StadiumViewSet(viewsets.ModelViewSet):
    queryset           = Stadium.objects.all().order_by('name')
    serializer_class   = StadiumSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends    = [filters.SearchFilter]
    search_fields      = ['name', 'location']


class GameViewSet(viewsets.ModelViewSet):
    queryset           = Game.objects.select_related(
        'season', 'category', 'home_team', 'away_team', 'stadium'
    ).order_by('-game_date')
    serializer_class   = GameSerializer
    permission_classes = [IsAdminOrReadOnly, IsLeagueOwnerOrSuperAdmin]

    def get_queryset(self):
        qs          = super().get_queryset()
        season_id   = self.request.query_params.get('season')
        category_id = self.request.query_params.get('category')
        team_id     = self.request.query_params.get('team')
        game_status = self.request.query_params.get('status')

        if season_id:
            qs = qs.filter(season_id=season_id)
        if category_id:
            qs = qs.filter(category_id=category_id)
        if team_id:
            qs = qs.filter(home_team_id=team_id) | qs.filter(away_team_id=team_id)
        if game_status:
            qs = qs.filter(status=game_status)
        return qs

    @action(detail=True, methods=['patch'], url_path='status')
    def update_status(self, request, pk=None):
        """
        PATCH /api/games/<id>/status/
        Actualiza solo el estado del juego. Al marcarse como 'finished',
        el signal on_game_status_change recalcula los standings.
        """
        game       = self.get_object()
        serializer = GameStatusSerializer(game, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            if serializer.validated_data.get('status') == Game.Status.FINISHED:
                cache.clear()
            return Response(GameSerializer(game).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='recent')
    def recent(self, request):
        """GET /api/games/recent/ — últimos 10 juegos finalizados."""
        qs = self.get_queryset().filter(status=Game.Status.FINISHED)[:10]
        return Response(GameSerializer(qs, many=True).data)

    @action(detail=False, methods=['get'], url_path='upcoming')
    def upcoming(self, request):
        """GET /api/games/upcoming/ — juegos programados o en vivo en las próximas 48h."""
        now = timezone.now()
        window = now + timedelta(hours=48)
        qs = self.get_queryset().filter(
            game_date__gte=now - timedelta(hours=4),
            game_date__lte=window,
            status__in=[Game.Status.SCHEDULED, Game.Status.LIVE],
        ).order_by('game_date')[:12]
        return Response(GameSerializer(qs, many=True).data)

    @action(detail=False, methods=['get'], url_path='summary')
    def summary(self, request):
        """GET /api/games/summary/ — contadores globales para la home."""
        from .models import Player, League
        return Response({
            'players_count': Player.objects.count(),
            'leagues_count': League.objects.count(),
            'games_count': Game.objects.filter(status=Game.Status.FINISHED).count(),
        })


# ===========================================================
# ESTADÍSTICAS
# ===========================================================

class StatsBattingViewSet(viewsets.ModelViewSet):
    queryset           = StatsBatting.objects.select_related('player', 'team', 'game').all()
    serializer_class   = StatsBattingSerializer
    permission_classes = [IsLeagueAdminOrSuperAdmin]

    def get_permissions(self):
        """El endpoint 'leaders' es de solo lectura y público."""
        if self.action == 'leaders':
            from rest_framework.permissions import AllowAny
            return [AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        qs      = super().get_queryset()
        game_id = self.request.query_params.get('game')
        team_id = self.request.query_params.get('team')
        if game_id:
            qs = qs.filter(game_id=game_id)
        if team_id:
            qs = qs.filter(team_id=team_id)
        return qs

    def perform_create(self, serializer):
        serializer.save()
        cache.clear()

    def perform_update(self, serializer):
        serializer.save()
        cache.clear()

    def perform_destroy(self, instance):
        instance.delete()
        cache.clear()

    @action(detail=False, methods=['get'], url_path='leaders')
    def leaders(self, request):
        """
        GET /api/stats/batting/leaders/?season=<id>&category=<id>&stat=avg&limit=10
        Líderes de bateo por el stat solicitado.
        """
        season_id   = request.query_params.get('season', '')
        category_id = request.query_params.get('category', '')
        stat        = request.query_params.get('stat', 'avg').replace('total_', '')
        limit       = int(request.query_params.get('limit', 10))
        offset      = int(request.query_params.get('offset', 0))

        cache_key = f"batters_{season_id}_{category_id}_{stat}_{limit}_{offset}"
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        VALID_STATS = {'avg', 'hr', 'rbi', 'h', 'bb', 'sb', 'so', 'ab', 'pa', 'r', '2b', '3b', 'hbp', 'sf'}
        if stat not in VALID_STATS:
            return Response({'error': f'stat debe ser uno de: {VALID_STATS}'}, status=400)

        qs = StatsBatting.objects.all()
        if season_id:
            qs = qs.filter(game__season_id=season_id)
        if category_id:
            qs = qs.filter(game__category_id=category_id)

        from django.db.models import Count
        agg = (
            qs
            .values('player_id', 'player__first_name', 'player__last_name', 'team__name')
            .annotate(
                total_ab=Sum('ab'), total_h=Sum('h'),
                total_hr=Sum('hr'), total_rbi=Sum('rbi'),
                total_bb=Sum('bb'), total_sb=Sum('sb'), total_so=Sum('so'),
            )
            .filter(total_ab__gt=0)
        )

        results = []
        for row in agg:
            ab  = row['total_ab'] or 1
            h   = row['total_h'] or 0
            row['avg'] = round(h / ab, 3)
            results.append(row)

        sort_key = 'avg' if stat == 'avg' else f'total_{stat}'
        results.sort(key=lambda x: x.get(sort_key, 0), reverse=True)

        data = {
            'count': len(results),
            'results': results[offset : offset + limit]
        }
        cache.set(cache_key, data, timeout=3600)
        return Response(data)


class StatsPitchingViewSet(viewsets.ModelViewSet):
    queryset           = StatsPitching.objects.select_related('player', 'team', 'game').all()
    serializer_class   = StatsPitchingSerializer
    permission_classes = [IsLeagueAdminOrSuperAdmin]

    def get_permissions(self):
        """El endpoint 'leaders' es de solo lectura y público."""
        if self.action == 'leaders':
            from rest_framework.permissions import AllowAny
            return [AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        qs      = super().get_queryset()
        game_id = self.request.query_params.get('game')
        team_id = self.request.query_params.get('team')
        if game_id:
            qs = qs.filter(game_id=game_id)
        if team_id:
            qs = qs.filter(team_id=team_id)
        return qs

    def perform_create(self, serializer):
        serializer.save()
        cache.clear()

    def perform_update(self, serializer):
        serializer.save()
        cache.clear()

    def perform_destroy(self, instance):
        instance.delete()
        cache.clear()

    @action(detail=False, methods=['get'], url_path='leaders')
    def leaders(self, request):
        """
        GET /api/stats/pitching/leaders/?season=<id>&category=<id>&stat=era&limit=10
        Líderes de pitcheo.
        """
        season_id   = request.query_params.get('season', '')
        category_id = request.query_params.get('category', '')
        stat        = request.query_params.get('stat', 'era').replace('total_', '')
        limit       = int(request.query_params.get('limit', 10))
        offset      = int(request.query_params.get('offset', 0))

        cache_key = f"pitchers_{season_id}_{category_id}_{stat}_{limit}_{offset}"
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        VALID_STATS = {'era', 'whip', 'so', 'bb', 'h', 'r', 'er', 'wins', 'ip_outs'}
        if stat not in VALID_STATS:
            return Response({'error': f'stat debe ser uno de: {VALID_STATS}'}, status=400)

        qs = StatsPitching.objects.all()
        if season_id:
            qs = qs.filter(game__season_id=season_id)
        if category_id:
            qs = qs.filter(game__category_id=category_id)

        agg = (
            qs
            .values('player_id', 'player__first_name', 'player__last_name', 'team__name')
            .annotate(
                total_ip_outs=Sum('ip_outs'), total_er=Sum('er'),
                total_so=Sum('so'), total_bb=Sum('bb'), total_h=Sum('h'),
                wins=Count('id', filter=Q(decision='win')),
            )
            .filter(total_ip_outs__gt=0)
        )

        results = []
        for row in agg:
            ip  = row['total_ip_outs'] or 1
            er  = row['total_er'] or 0
            bb  = row['total_bb'] or 0
            h   = row['total_h'] or 0
            row['era']  = round((er * 27) / ip, 2)
            row['whip'] = round((bb + h) / (ip / 3), 2)
            results.append(row)

        # Ordenación genérica
        if stat == 'era' or stat == 'whip':
            results.sort(key=lambda x: x.get(stat, 999))
        else:
            # Para stats donde 'más es mejor' - buscar en agg keys
            key = 'wins' if stat == 'wins' else (f'total_{stat}' if f'total_{stat}' in (agg[0] if agg else {}) else stat)
            results.sort(key=lambda x: x.get(key, 0), reverse=True)

        data = {
            'count': len(results),
            'results': results[offset : offset + limit]
        }
        cache.set(cache_key, data, timeout=3600)
        return Response(data)
