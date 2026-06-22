# -*- coding: utf-8 -*-
"""comun.py — nombres canónicos (ES) y equivalencias con results.csv y worldcup.json."""

# worldcup.json (EN) -> canónico (ES)
JSON_A_CANON = {
 'Algeria':'Argelia','Argentina':'Argentina','Australia':'Australia','Austria':'Austria',
 'Belgium':'Bélgica','Bosnia & Herzegovina':'Bosnia y Herzegovina','Brazil':'Brasil',
 'Canada':'Canadá','Cape Verde':'Cabo Verde','Colombia':'Colombia','Croatia':'Croacia',
 'Curaçao':'Curaçao','Czech Republic':'Chequia','DR Congo':'RD Congo','Ecuador':'Ecuador',
 'Egypt':'Egipto','England':'Inglaterra','France':'Francia','Germany':'Alemania',
 'Ghana':'Ghana','Haiti':'Haití','Iran':'Irán','Iraq':'Irak','Ivory Coast':'Costa de Marfil',
 'Japan':'Japón','Jordan':'Jordania','Mexico':'México','Morocco':'Marruecos',
 'Netherlands':'Países Bajos','New Zealand':'Nueva Zelanda','Norway':'Noruega',
 'Panama':'Panamá','Paraguay':'Paraguay','Portugal':'Portugal','Qatar':'Qatar',
 'Saudi Arabia':'Arabia Saudita','Scotland':'Escocia','Senegal':'Senegal',
 'South Africa':'Sudáfrica','South Korea':'Corea del Sur','Spain':'España','Sweden':'Suecia',
 'Switzerland':'Suiza','Tunisia':'Túnez','Turkey':'Turquía','USA':'Estados Unidos',
 'Uruguay':'Uruguay','Uzbekistan':'Uzbekistán'}

# canónico -> nombre en results.csv (difiere del json en 2 casos)
CANON_A_RESULTS = {v: k for k, v in JSON_A_CANON.items()}
CANON_A_RESULTS['Bosnia y Herzegovina'] = 'Bosnia and Herzegovina'
CANON_A_RESULTS['Estados Unidos'] = 'United States'

CANON_A_JSON = {v: k for k, v in JSON_A_CANON.items()}

CONFED = {
 'Austria':'UEFA','Bélgica':'UEFA','Bosnia y Herzegovina':'UEFA','Croacia':'UEFA',
 'Chequia':'UEFA','Inglaterra':'UEFA','Francia':'UEFA','Alemania':'UEFA',
 'Países Bajos':'UEFA','Noruega':'UEFA','Portugal':'UEFA','Escocia':'UEFA','España':'UEFA',
 'Suecia':'UEFA','Suiza':'UEFA','Turquía':'UEFA',
 'Argentina':'CONMEBOL','Brasil':'CONMEBOL','Colombia':'CONMEBOL','Ecuador':'CONMEBOL',
 'Paraguay':'CONMEBOL','Uruguay':'CONMEBOL',
 'Canadá':'CONCACAF','Curaçao':'CONCACAF','Haití':'CONCACAF','México':'CONCACAF',
 'Panamá':'CONCACAF','Estados Unidos':'CONCACAF',
 'Argelia':'CAF','Cabo Verde':'CAF','RD Congo':'CAF','Egipto':'CAF','Ghana':'CAF',
 'Costa de Marfil':'CAF','Marruecos':'CAF','Senegal':'CAF','Sudáfrica':'CAF','Túnez':'CAF',
 'Australia':'AFC','Irán':'AFC','Irak':'AFC','Japón':'AFC','Jordania':'AFC','Qatar':'AFC',
 'Arabia Saudita':'AFC','Corea del Sur':'AFC','Uzbekistán':'AFC',
 'Nueva Zelanda':'OFC'}

CIUDAD_PAIS = {
 'Mexico City':'México','Guadalajara (Zapopan)':'México','Monterrey (Guadalupe)':'México',
 'Guadalupe':'México','Zapopan':'México',
 'Toronto':'Canadá','Vancouver':'Canadá'}  # resto: Estados Unidos

FASE = {'Round of 32':'R32','Round of 16':'Octavos','Quarter-final':'Cuartos',
        'Semi-final':'Semis','Match for third place':'3er Puesto','Final':'Final'}

def fase_de(round_str):
    return 'Grupos' if round_str.startswith('Matchday') else FASE.get(round_str, round_str)

def pais_sede(ground):
    return CIUDAD_PAIS.get(ground, 'Estados Unidos')

def canon(nombre_json):
    """Nombre canónico de un nombre del json; los placeholders (1A, W73...) pasan tal cual."""
    return JSON_A_CANON.get(nombre_json, nombre_json)

import re, json
from datetime import datetime, timedelta

def cargar_fixture(path_json):
    """Lista de partidos ordenada cronológicamente (UTC) con ID 1..104."""
    d = json.load(open(path_json, encoding='utf-8'))
    ms = []
    for m in d['matches']:
        hh, mm_, off = re.match(r'(\d+):(\d+) UTC([+-]\d+)', m['time']).groups()
        dt_utc = datetime.fromisoformat(m['date']) + timedelta(hours=int(hh)-int(off), minutes=int(mm_))
        ms.append((dt_utc, m))
    ms.sort(key=lambda x: (x[0], x[1].get('group') or '', x[1].get('num') or 0))
    out = []
    for i, (dt, m) in enumerate(ms, 1):
        out.append({
            'id': i, 'num': m.get('num'), 'fecha': m['date'],
            'fase': fase_de(m['round']), 'grupo': (m.get('group') or '').replace('Group ',''),
            'a': canon(m['team1']), 'b': canon(m['team2']),
            'ciudad': m.get('ground',''), 'pais': pais_sede(m.get('ground','')),
            'score': m.get('score'),
        })
    return out
