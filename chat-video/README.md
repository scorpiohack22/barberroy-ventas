# Video: lo que hablamos en este chat

Video horizontal de 1 minuto (1920x1080, 30 fps), hecho con Remotion en estilo SaaS.
Cuenta la conversación en la que se crearon el tutorial (`tutorial-video/`) y el reel (`reel-ia/`).
Usa tomas reales de ambos videos (`public/tutorial.mp4`, `public/reel.mp4`) y datos reales de la
narración (onda y transcripción en `src/data.ts`).

| Tiempo | Escena |
|---|---|
| 0–5 s | El comando `/saas-animation` que no estaba instalado |
| 5–13 s | Pedido del tutorial y render en la terminal |
| 13–22 s | El tutorial real, a velocidad x3 |
| 22–34 s | Narración → transcripción → storyboard → reel |
| 34–42 s | "Los efectos están muy altos": mezcla y ducking |
| 42–52 s | Conexión de Higgsfield y qué se pudo hacer (créditos, After Effects) |
| 52–60 s | Resumen en números y cierre |

```bash
npm install
npm run audio    # regenera public/musica.wav (requiere numpy)
npm run render   # genera out/chat-video.mp4
```
