import os
import django
import json
from django.core.serializers import serialize

# Switch to SQLite explicitly
os.environ['DATABASE_URL'] = ''
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.apps import apps
from core.models import (
    User, League, Season, Category, Team, Player, 
    Stadium, Roster, Game, StatsBatting, StatsPitching
)

models_to_dump = [
    User, League, Season, Category, Team, Player, 
    Stadium, Roster, Game, StatsBatting, StatsPitching
]

all_objects = []
for model in models_to_dump:
    objects = model.objects.all()
    # Serialize to python dicts first to combine them safely
    serialized = serialize('python', objects)
    all_objects.extend(serialized)

from django.core.serializers.json import DjangoJSONEncoder

with open('backup_perfect.json', 'w', encoding='utf-8') as f:
    json.dump(all_objects, f, cls=DjangoJSONEncoder, ensure_ascii=False, indent=2)

print(f"Dumped {len(all_objects)} objects to backup_perfect.json")
