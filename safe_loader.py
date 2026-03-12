import os
import json
import django

# Load settings and setup django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.apps import apps
from django.db import transaction

with open('backup_final.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Group by model
models_data = {}
for item in data:
    models_data.setdefault(item['model'], []).append(item)

# Load order
load_order = [
    'core.user', 'core.league', 'core.season', 'core.category', 
    'core.stadium', 'core.team', 'core.player', 'core.roster', 
    'core.game', 'core.statsbatting', 'core.statspitching'
]

mapped = 0
try:
    with transaction.atomic():
        for model_name in load_order:
            if model_name not in models_data:
                continue
                
            ModelClass = apps.get_model(model_name)
            items = models_data[model_name]
            
            print(f"Loading {len(items)} items for {model_name}...")
            
            for item in items:
                fields = item['fields']
                pk = item.get('pk')
                
                # Deal with natural keys (foreign keys that are names instead of IDs)
                # For this specific backup_final, natural keys are disabled, so foreign keys are IDs.
                
                # Automatically map foreign keys (append _id to relational fields integer vals)
                new_fields = {}
                for k, v in fields.items():
                    # If field expects an object but we have an ID (like category=1), map to category_id
                    try:
                        f = ModelClass._meta.get_field(k)
                        if f.is_relation and not k.endswith('_id'):
                            new_fields[k + '_id'] = v
                        else:
                            new_fields[k] = v
                    except Exception:
                        new_fields[k] = v
                fields = new_fields
                
                if model_name == 'core.user':
                    fields.pop('groups', None)
                    fields.pop('user_permissions', None)
                    fields.pop('groups_id', None)
                    fields.pop('user_permissions_id', None)
                
                # Assign explicitly PK to keep relationships intact
                if pk:
                    fields['id'] = pk
                    
                ModelClass.objects.create(**fields)
                
                mapped += 1

    print(f"✅ Successfully loaded {mapped} objects into Supabase!")
except Exception as e:
    print(f"❌ Error loading data: {e}")
