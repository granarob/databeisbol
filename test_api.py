import requests
import time
import sys

BASE_URL = "http://127.0.0.1:8000/api/v1"

def print_result(name, success, info=""):
    status = "PASS" if success else "FAIL"
    print(f"{status} | {name.ljust(40)} | {info}")

def test_endpoint(name, path, expected_status=200, check_fn=None):
    url = f"{BASE_URL}{path}"
    try:
        start = time.time()
        res = requests.get(url, timeout=5)
        elapsed = time.time() - start
        
        is_success = res.status_code == expected_status
        info = f"{int(elapsed*1000)}ms"
        
        if is_success and check_fn:
            is_success, msg = check_fn(res)
            if msg:
                info += f" - {msg}"
            
        print_result(name, is_success, info)
        return is_success
    except Exception as e:
        print_result(name, False, str(e))
        return False

print("="*60)
print("INICIANDO REVISIÓN GENERAL DE FUNCIONALIDAD (BEISBOLDATA)")
print("="*60)

# Check 1: Jugadores (Paginación normal)
def check_players(res):
    data = res.json()
    return 'count' in data, f"Total: {data.get('count', 0)}"
test_endpoint("Listar Jugadores", "/players/", 200, check_players)

# Check 2: Equipos & Standings
test_endpoint("Listar Equipos", "/teams/", 200)
test_endpoint("Standings", "/teams/standings/", 200)

# Check 3: Líderes de Bateo (Filtro, Limit)
def check_batting_leaders(res):
    data = res.json()
    count = len(data.get('results', []))
    return count > 0, f"Retornados: {count}"
test_endpoint("Líderes de Bateo (AVG)", "/stats/batting/leaders/?stat=avg&limit=5", 200, check_batting_leaders)
test_endpoint("Líderes de Bateo (HR)", "/stats/batting/leaders/?stat=hr&limit=5", 200, check_batting_leaders)

# Check 4: Líderes de Pitcheo
test_endpoint("Líderes de Pitcheo (ERA)", "/stats/pitching/leaders/?stat=era&limit=5", 200)

# Check 5: Reporte PDF
def check_pdf(res):
    is_pdf = res.headers.get('Content-Type') == 'application/pdf'
    return is_pdf, f"Size: {len(res.content)} bytes"
test_endpoint("Exportar PDF Líderes", "/reports/batting-leaders/pdf/", 200, check_pdf)

# Check 6: Reporte Excel
def check_excel(res):
    is_excel = 'spreadsheetml' in res.headers.get('Content-Type', '')
    return is_excel, f"Size: {len(res.content)} bytes"
test_endpoint("Exportar Excel Standings", "/reports/standings/excel/", 200, check_excel)

print("="*60)
print("REVISIÓN COMPLETADA")
