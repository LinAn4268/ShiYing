import json, io, os

base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data_dir = os.path.join(base, 'data')

chapters = []
for f in ['ch1-3.json', 'ch4-7.json', 'ch8-10.json']:
    with io.open(os.path.join(data_dir, f), 'r', encoding='utf-8') as fh:
        chapters.extend(json.load(fh)['chapters'])

with io.open(os.path.join(data_dir, 'glossary.json'), 'r', encoding='utf-8') as fh:
    glossary = json.load(fh)

with io.open(os.path.join(base, 'index.template.html'), 'r', encoding='utf-8') as fh:
    tpl = fh.read()

# Compact JSON, ensure no literal </script> can break inline script
data_json = json.dumps(chapters, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
gloss_json = json.dumps(glossary, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')

out = tpl.replace('/*__DATA__*/', data_json).replace('/*__GLOSSARY__*/', gloss_json)

with io.open(os.path.join(base, 'index.html'), 'w', encoding='utf-8') as fh:
    fh.write(out)

print('chapters:', len(chapters))
print('sections:', sum(len(c['sections']) for c in chapters))
print('items:', sum(len(s['items']) for c in chapters for s in c['sections']))
print('output bytes:', len(out.encode('utf-8')))
