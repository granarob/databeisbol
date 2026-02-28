from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminOrReadOnly(BasePermission):
    """
    Solo super_admin y league_admin pueden escribir.
    Lectores (viewer, anónimos) solo GET.
    """
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role in (
            'super_admin', 'league_admin'
        )


class IsSuperAdmin(BasePermission):
    """Solo super_admin puede acceder."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'super_admin'


class IsLeagueAdminOrSuperAdmin(BasePermission):
    """super_admin o league_admin pueden escribir."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in (
            'super_admin', 'league_admin'
        )


class IsLeagueOwnerOrSuperAdmin(BasePermission):
    """
    Un league_admin solo puede modificar objetos de su propia liga.
    super_admin puede todo.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        user = request.user
        if user.role == 'super_admin':
            return True
        if user.role == 'league_admin':
            # Intentar resolver la liga del objeto
            if hasattr(obj, 'league'):
                return obj.league.admin == user
            if hasattr(obj, 'season') and hasattr(obj.season, 'league'):
                return obj.season.league.admin == user
            if hasattr(obj, 'category') and hasattr(obj.category, 'league'):
                return obj.category.league.admin == user
            if hasattr(obj, 'team') and hasattr(obj.team, 'season'):
                return obj.team.season.league.admin == user
            if hasattr(obj, 'game') and hasattr(obj.game, 'season'):
                return obj.game.season.league.admin == user
        return False
