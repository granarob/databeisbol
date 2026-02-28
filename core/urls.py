from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    RegisterView, MeView,
    UserViewSet,
    LeagueViewSet, SeasonViewSet, CategoryViewSet,
    TeamViewSet, PlayerViewSet, RosterViewSet,
    StadiumViewSet, GameViewSet,
    StatsBattingViewSet, StatsPitchingViewSet,
)

router = DefaultRouter()
router.register(r'users',          UserViewSet,          basename='user')
router.register(r'leagues',        LeagueViewSet,        basename='league')
router.register(r'seasons',        SeasonViewSet,        basename='season')
router.register(r'categories',     CategoryViewSet,      basename='category')
router.register(r'teams',          TeamViewSet,          basename='team')
router.register(r'players',        PlayerViewSet,        basename='player')
router.register(r'rosters',        RosterViewSet,        basename='roster')
router.register(r'stadiums',       StadiumViewSet,       basename='stadium')
router.register(r'games',          GameViewSet,          basename='game')
router.register(r'stats/batting',  StatsBattingViewSet,  basename='stats-batting')
router.register(r'stats/pitching', StatsPitchingViewSet, basename='stats-pitching')

from .reports import export_batting_leaders_pdf, export_standings_excel

urlpatterns = [
    # JWT Auth
    path('auth/login/',   TokenObtainPairView.as_view(), name='token_obtain'),
    path('auth/refresh/', TokenRefreshView.as_view(),    name='token_refresh'),
    path('auth/register/', RegisterView.as_view(),       name='register'),
    path('auth/me/',       MeView.as_view(),             name='me'),

    # Reportes (Exportación)
    path('reports/batting-leaders/pdf/', export_batting_leaders_pdf, name='report-batting-pdf'),
    path('reports/standings/excel/',     export_standings_excel,      name='report-standings-excel'),

    # Todos los endpoints CRUD + acciones especiales
    path('', include(router.urls)),
]
