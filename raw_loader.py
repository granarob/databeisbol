import os
import json
import psycopg
from decouple import config

# Leer variable de entorno
db_url = config('DATABASE_URL')
print(f"Connecting to: {db_url}")

with open('backup_final.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Sort models to handle dependencies (Auth -> Core)
sorted_data = sorted(data, key=lambda x: (
    not x['model'].startswith('auth'),
    not x['model'].startswith('core.user'),
    x['model']
))

conn = psycopg.connect(db_url)
print("Connected successfully!")

try:
    for item in sorted_data:
        model = item['model']
        pk = item['pk']
        fields = item['fields']
        
        # Django model to table name mapping
        table_name = model.replace('.', '_')
        
        columns = ['id'] if pk else []
        values = [pk] if pk else []
        
        for k, v in fields.items():
            columns.append(k)
            values.append(v)
            
        col_str = ', '.join([f'"{c}"' for c in columns])
        val_str = ', '.join(['%s'] * len(values))
        
        query = f'INSERT INTO "{table_name}" ({col_str}) VALUES ({val_str}) ON CONFLICT ("id") DO NOTHING;'
        
        with conn.cursor() as cur:
            cur.execute(query, values)
            
    conn.commit()
    print("Migration completed ✅")
    
except Exception as e:
    conn.rollback()
    print(f"Error migrating: {e}")
finally:
    conn.close()
