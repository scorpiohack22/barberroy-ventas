import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
L=open('v6b7.html').read().split('\n')
i0=next(i for i,l in enumerate(L) if l.startswith('// ================= SCENES'))
i1=next(i for i,l in enumerate(L) if l.startswith('// ================= RENDER'))
head='\n'.join(L[:i0]).replace("const IMG_DIR = '../yt7/img/';","const IMG_DIR = '../yt9/img/';")
assert "../yt9/img/" in head
tail='\n'.join(L[i1:]).replace('await loadPhotos(PH_LIST, PH_GRADE)','await loadSoft(PH_LIST, PH_GRADE)')
assert 'loadSoft(PH_LIST' in tail
lab='v8_lab.js' if os.environ.get('SHARED') and os.path.exists('v8_lab.js') else None
parts=[head]
if lab: parts.append(open(lab).read().replace('</script>','<\\/script>'))
parts += [open('v8b1_lab.js').read().replace('</script>','<\\/script>'), open('v8b1_scenes.js').read().replace('</script>','<\\/script>'), tail]
open('v8b1.html','w').write('\n'.join(parts)+'\n')
print('ok', 'shared' if lab else 'own')
