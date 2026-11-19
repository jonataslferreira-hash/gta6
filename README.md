# Vice City — Maré Alta

Jogo de navegador não oficial, inspirado no clima tropical e na arte ilustrada de Vice City. A campanha acompanha Luzia e começa com **As duas chaves**, o primeiro capítulo em quatro missões. O modo livre tem duas ambientações, orla ao entardecer e marina à noite, e três pontos de atividade: contrarrelógio, entregas e mirante.

## Executar

```bash
npm ci
npm run dev
npm run build
```

Requer navegador com WebGL 2. No teclado: **WASD / setas** para se mover ou dirigir, **Shift** para correr, **Espaço** para frear, **E** para interagir, **R** para trocar a estação, **M** para o mapa e **Esc** para pausar. Arraste a cena para girar a câmera. Em aparelhos com ponteiro primário de toque, o jogo exibe joystick e botões na tela.

O cenário 3D é construído com Three.js. A qualidade gráfica ajusta sombras e resolução sem mexer na exposição. O rádio tem seis faixas instrumentais originais, arranjadas e sintetizadas via Web Audio em três estações (sem amostras externas). As legendas são sempre exibidas; para as falas audíveis, o navegador precisa oferecer uma voz em português. Ajustes e checkpoints da campanha são gravados no armazenamento local do navegador.

## Publicação

O [jogo no GitHub Pages](https://jonataslferreira-hash.github.io/gta6/) é atualizado pelo workflow `.github/workflows/pages.yml` a cada push na `main`. Em **Settings → Pages**, a origem deve ser **GitHub Actions**. Publique a pasta `dist/` gerada por `npm run build`, não os arquivos-fonte do repositório.

Também é possível abrir pelo [endereço alternativo](https://jonataslferreira-hash.github.io/gta6/jogar.html). Após cada publicação, o workflow abre os dois endereços públicos no Chromium e verifica se o menu e as imagens carregam. Para repetir o teste localmente, inicie `npm run preview` após o build e use `npx playwright install chromium` e `npm test`.
