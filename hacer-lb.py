# Genera lb.html (página del candidato de Grupo La Barra) a partir de c.html. Ejecutar: python3 hacer-lb.py
import re
s = open('c.html', encoding='utf-8').read()
s = re.sub(r'<title>[^<]*</title>\n<meta property="og:title"[^>]*>',
  '<title>Completar expediente · Grupo La Barra</title>\n<meta property="og:title" content="Grupo La Barra · Complete su expediente de ingreso">\n'
  '<meta property="og:description" content="Recursos Humanos · Grupo La Barra">\n<meta name="theme-color" content="#C91017">', s)
s = s.replace('fill=%22%231350d6%22', 'fill=%22%23C91017%22').replace('%3EATE%3C', '%3ELB%3C')
s = s.replace('<div class="logo">ATE</div><div>Asesores Técnicos Empresariales<small>Recursos Humanos</small></div>',
  '<div class="logo" style="background:#C91017">LB</div><div>Grupo La Barra<small>Recursos Humanos</small></div>')
assert 'Asesores' not in s and 'ATE<' not in s
open('lb.html', 'w', encoding='utf-8').write(s)
