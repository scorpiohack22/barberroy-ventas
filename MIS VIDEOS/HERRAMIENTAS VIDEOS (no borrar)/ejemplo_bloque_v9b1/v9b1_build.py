import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
L=open('v6b7.html').read().split('\n')
i0=next(i for i,l in enumerate(L) if l.startswith('// ================= SCENES'))
i1=next(i for i,l in enumerate(L) if l.startswith('// ================= RENDER'))
head='\n'.join(L[:i0]).replace("const IMG_DIR = '../yt7/img/';","const IMG_DIR = '../yt10/img/';")
assert "../yt10/img/" in head
tail='\n'.join(L[i1:]).replace('await loadPhotos(PH_LIST, PH_GRADE)','await loadSoft(PH_LIST, PH_GRADE)')
assert 'loadSoft(PH_LIST' in tail
a='  if (S.label) typeLabel(S.label, lt);'
assert a in tail
tail=tail.replace(a,'  if (S.hud) { const kc = ctx; ctx = octx; LSP.length = 0; LS = 1; ctx.save(); S.hud(lt, d, t); ctx.restore(); ctx = kc; }\n'+a)
parts=[head]
parts += [open('v9b1_cam.js').read().replace('</script>','<\\/script>'), open('v9b1_scenes.js').read().replace('</script>','<\\/script>'), tail]
open('v9b1.html','w').write('\n'.join(parts)+'\n')
print('ok')
