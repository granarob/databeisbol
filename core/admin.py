from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User, League, Season, Category,
    Team, Player, Roster,
    Stadium, Game,
    StatsBatting, StatsPitching,
)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display  = ['username', 'full_name', 'role', 'is_active']
    list_filter   = ['role', 'is_active']
    search_fields = ['username', 'full_name']
    ordering      = ['username']
    fieldsets = (
        (None,           {'fields': ('username', 'password')}),
        ('Datos',        {'fields': ('full_name', 'role')}),
        ('Permisos',     {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {'classes': ('wide',), 'fields': ('username', 'full_name', 'role', 'password1', 'password2')}),
    )


@admin.register(League)
class LeagueAdmin(admin.ModelAdmin):
    list_display  = ['name', 'city', 'country', 'admin']
    search_fields = ['name']
    fields        = ['name', 'country', 'city', 'admin']


@admin.register(Season)
class SeasonAdmin(admin.ModelAdmin):
    list_display  = ['name', 'league', 'start_date', 'end_date', 'is_active']
    list_filter   = ['is_active', 'league']


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display  = ['name', 'league', 'age_min', 'age_max']
    list_filter   = ['league']


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display  = ['name', 'short_name', 'category', 'season', 'won', 'lost', 'tied', 'logo_preview']
    list_filter   = ['season', 'category']
    search_fields = ['name', 'short_name']
    readonly_fields = ['logo_url', 'logo_preview']
    fields        = [
        'name', 'short_name', 'category', 'season', 'manager_name',
        'logo_upload', 'logo_preview', 'logo_url',
        'won', 'lost', 'tied',
    ]

    @admin.display(description='Logo actual')
    def logo_preview(self, obj):
        from django.utils.html import format_html
        if obj.logo_url:
            return format_html('<img src="{}" style="height:40px;border-radius:4px;" />', obj.logo_url)
        return '—'


@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display  = ['last_name', 'first_name', 'birth_date', 'bats_hand', 'throws_hand', 'photo_preview']
    search_fields = ['first_name', 'last_name']
    list_filter   = ['bats_hand', 'throws_hand']
    readonly_fields = ['photo_url', 'photo_preview']
    fields        = [
        'first_name', 'last_name', 'birth_date',
        'height_cm', 'weight_kg', 'bats_hand', 'throws_hand',
        'bio', 'photo_upload', 'photo_preview', 'photo_url',
    ]

    @admin.display(description='Foto actual')
    def photo_preview(self, obj):
        from django.utils.html import format_html
        if obj.photo_url:
            return format_html('<img src="{}" style="height:60px;border-radius:50%;" />', obj.photo_url)
        return '—'


@admin.register(Roster)
class RosterAdmin(admin.ModelAdmin):
    list_display  = ['jersey_number', 'player', 'team', 'is_active']
    list_filter   = ['team', 'is_active']
    search_fields = ['player__first_name', 'player__last_name']


@admin.register(Stadium)
class StadiumAdmin(admin.ModelAdmin):
    list_display  = ['name', 'location']
    search_fields = ['name']


@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display  = ['__str__', 'game_date', 'status', 'home_score', 'away_score']
    list_filter   = ['status', 'season', 'category']
    search_fields = ['home_team__name', 'away_team__name']


class StatsBattingInline(admin.TabularInline):
    model  = StatsBatting
    extra  = 0
    fields = ['player', 'pa', 'ab', 'r', 'h', 'doubles', 'triples', 'hr', 'rbi', 'bb', 'so', 'sb']


class StatsPitchingInline(admin.TabularInline):
    model  = StatsPitching
    extra  = 0
    fields = ['player', 'ip_outs', 'h', 'r', 'er', 'bb', 'so', 'decision']


@admin.register(StatsBatting)
class StatsBattingAdmin(admin.ModelAdmin):
    list_display  = ['player', 'game', 'position', 'ab', 'h', 'hr', 'rbi', 'bb', 'so']
    list_filter   = ['game__season', 'team', 'position']
    search_fields = ['player__first_name', 'player__last_name']


@admin.register(StatsPitching)
class StatsPitchingAdmin(admin.ModelAdmin):
    list_display  = ['player', 'game', 'ip_outs', 'er', 'bb', 'so', 'decision']
    list_filter   = ['game__season', 'team', 'decision']
    search_fields = ['player__first_name', 'player__last_name']
