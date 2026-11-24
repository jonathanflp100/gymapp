import json, re, glob, os
rep=json.load(open('/root/ext/repdb/src/exercises.json'))['exercises']
rep=[r for r in rep if r.get('images',{}).get('flat')]
idx=json.load(open('/root/gymapp/public/catalogo/indice.json'))
ids=[r[0] for r in idx]
og={}
for i in ids:
    p=f'/root/ext/openGym/catalogue/exercises/{i}.json'
    if os.path.exists(p):
        j=json.load(open(p)); og[i]=j
SYN={'dumbbells':'dumbbell','db':'dumbbell','lever':'machine','barbells':'barbell','ez':'ezbar','ezbar':'ezbar','ups':'up','pushup':'push up','pullup':'pull up','chinup':'chin up','situp':'sit up','raises':'raise','curls':'curl','presses':'press','rows':'row','flyes':'fly','flys':'fly','flye':'fly','extensions':'extension','crunches':'crunch','lunges':'lunge','squats':'squat'}
STOP={'with','the','a','on','of','and','to','v','2','standing'}
def toks(s):
    s=s.lower().replace('-',' ').replace('/',' ')
    s=re.sub(r'[^a-z0-9 ]',' ',s)
    out=[]
    for w in s.split():
        w=SYN.get(w,w)
        out+=w.split()
    return frozenset(w for w in out if w not in STOP)
EQ={'barbell':'barbell','dumbbell':'dumbbell','cable':'cable','body weight':None,'kettlebell':'kettlebell','smith machine':'smith_machine','ez barbell':'ez_bar','leverage machine':'machine','band':'resistance_band'}
repmap={}
for r in rep:
    t=toks(r['name_en'])
    eq=r.get('equipment')
    # garante que o equipamento esteja no nome para comparar com o openGym, que sempre começa pelo equipamento
    repmap.setdefault(t,r)
exact={}; 
for i,j in og.items():
    t=toks(j['name'])
    if t in repmap: exact[i]=repmap[t]['id']
print('exact',len(exact))
# fuzzy: openGym name tokens incluem equipamento; RepDB name pode omitir "barbell" etc. tenta adicionar equipamento do repdb
eqword={'barbell':'barbell','dumbbell':'dumbbell','cable':'cable','kettlebell':'kettlebell','smith_machine':'smith','ez_bar':'ezbar','machine':'machine','resistance_band':'band'}
rep2={}
for r in rep:
    t=set(toks(r['name_en']))
    e=eqword.get(r.get('equipment'))
    if e: t|=set(e.split())
    if r.get('is_bodyweight') or r.get('equipment') in (None,'pull_up_bar'): t2=t|{'body','weight'}
    else: t2=t
    rep2.setdefault(frozenset(t),r); rep2.setdefault(frozenset(t2),r)
m2={}
for i,j in og.items():
    if i in exact: continue
    t=toks(j['name'])
    t=frozenset(set(t)|({'smith'} if 'smith' in t else set()))
    if t in rep2: m2[i]=rep2[t]['id']
print('with-equip',len(m2))
allm={**exact,**m2}
json.dump(allm,open('/root/work/repdb/map.json','w'),indent=0,sort_keys=True)
import random; random.seed(1)
for i in random.sample(list(allm),40): print(i, og[i]['name'],'->',allm[i])
