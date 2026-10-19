import json,sys,re,os,subprocess
S=os.path.dirname(os.path.abspath(__file__))
P={}
for l in open(f"{S}/prompts.txt"):
    m=re.match(r"(\d\d\d) \[(CON|SIN) PERSONAJE\] (.*)",l.strip())
    if m: P[m.group(3).strip()]=(m.group(1),m.group(2))
idx=json.load(open(f"{S}/img/index.json")) if os.path.exists(f"{S}/img/index.json") else {}
new=0
for f in sys.argv[1:]:
  for x in json.load(open(f))['items']:
    pr=(x.get('params') or {}).get('prompt','').strip()
    if pr not in P or x['id'] in idx or x.get('status')!='completed': continue
    n,c=P[pr]; k=sum(1 for v in idx.values() if v['n']==n)
    fn=f"{n}_{k}.png"
    ok=False
    for _ in range(4):
        if subprocess.run(["curl","-sS","--retry","3","-o",f"{S}/img/{fn}",x['results']['rawUrl']]).returncode==0: ok=True; break
    if not ok: print("FAIL",fn); continue
    idx[x['id']]={"n":n,"con":c=="CON","file":fn}; new+=1
json.dump(idx,open(f"{S}/img/index.json","w"),indent=0)
have=sorted(set(v['n'] for v in idx.values())); print("new",new,"have",len(have),have[-1] if have else None)
