"""
Signals de Django para mantener el cache de scores y standings actualizado
sin recalcular desde cero en cada petición.
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Sum
from .models import StatsBatting, StatsPitching, Game, Team


def _recalculate_game_scores(game):
    """
    Recalcula home_score y away_score sumando las carreras de stats_batting
    de cada equipo en ese juego y actualiza el objeto Game.
    """
    home_runs = (
        StatsBatting.objects
        .filter(game=game, team=game.home_team)
        .aggregate(total=Sum('r'))['total'] or 0
    )
    away_runs = (
        StatsBatting.objects
        .filter(game=game, team=game.away_team)
        .aggregate(total=Sum('r'))['total'] or 0
    )
    Game.objects.filter(pk=game.pk).update(
        home_score=home_runs,
        away_score=away_runs,
    )


def _recalculate_team_standings(game):
    """
    Al cerrar un juego (status=finished), recalcula won/lost/tied
    de ambos equipos revisando todos sus juegos finalizados en la temporada.
    """
    from django.db.models import Q
    if game.status != Game.Status.FINISHED:
        return

    for team in [game.home_team, game.away_team]:
        finished_games = Game.objects.filter(
            season=game.season,
            status=Game.Status.FINISHED,
        ).filter(
            Q(home_team=team) | Q(away_team=team)
        )

        won = lost = tied = 0
        for g in finished_games:
            if g.home_score == g.away_score:
                tied += 1
            elif g.home_team_id == team.pk and g.home_score > g.away_score:
                won += 1
            elif g.away_team_id == team.pk and g.away_score > g.home_score:
                won += 1
            else:
                lost += 1

        Team.objects.filter(pk=team.pk).update(won=won, lost=lost, tied=tied)


@receiver(post_save, sender=StatsBatting)
def on_batting_save(sender, instance, **kwargs):
    """Cada vez que se guarda un stat de bateo, recalcular el marcador del juego."""
    _recalculate_game_scores(instance.game)


@receiver(post_delete, sender=StatsBatting)
def on_batting_delete(sender, instance, **kwargs):
    """Si se elimina un stat de bateo, recalcular el marcador."""
    _recalculate_game_scores(instance.game)


@receiver(post_save, sender=Game)
def on_game_status_change(sender, instance, **kwargs):
    """Cuando un juego se marca como finalizado, actualizar standings de equipos."""
    _recalculate_team_standings(instance)
