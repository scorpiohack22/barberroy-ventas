import sys,re,json,subprocess,urllib.parse
def search(q,sp=None):
    url="https://www.youtube.com/results?search_query="+urllib.parse.quote(q)+"&hl=es&gl=CO"+(f"&sp={sp}" if sp else "")
    h=subprocess.run(['curl','-s','--max-time','25','-H','Accept-Language: es-CO,es;q=0.9','-A','Mozilla/5.0',url],capture_output=True,text=True).stdout
    m=re.search(r'var ytInitialData = (\{.*?\});</script>',h)
    if not m: return []
    d=json.loads(m.group(1)); out=[]
    def walk(o):
        if isinstance(o,dict):
            if 'videoRenderer' in o:
                v=o['videoRenderer']
                t=''.join(r.get('text','') for r in v.get('title',{}).get('runs',[]))
                vc=v.get('viewCountText',{}).get('simpleText','') or ''.join(r.get('text','') for r in v.get('viewCountText',{}).get('runs',[]))
                ch=''.join(r.get('text','') for r in v.get('ownerText',{}).get('runs',[]))
                pt=v.get('publishedTimeText',{}).get('simpleText','')
                ln=v.get('lengthText',{}).get('simpleText','')
                out.append((t,vc,ch,pt,ln))
            for x in o.values(): walk(x)
        elif isinstance(o,list):
            for x in o: walk(x)
    walk(d); return out
for q in sys.argv[1:]:
    print("\n### "+q)
    for r in search(q)[:14]: print(" | ".join(r))
