# Vice City — Maré Alta

Jogo de navegador não oficial, inspirado no clima tropical e na arte ilustrada de Vice City. O novo prólogo começa dentro do Casino Miragem: passe pelos seguranças, pegue a fita, escape pelo terraço de paraquedas e despiste o carro que segue Luzia e Davi. O casal termina a fuga trocando de roupa no Vestiário Neon. A campanha continua em quatro missões com investigação, direção e painéis interativos.

As cenas são renderizadas em 3D com legendas, dublagem em português, expressão animada e cortes de câmera. A cidade tem um ciclo de luz contínuo de 20 minutos; os modos de exploração começam em horas diferentes. A casa dos dois fica em Ocean Beach, marcada com ⌂ no mapa. Chegue à sala e interaja para descansar e avançar o relógio suavemente.

Ao entrar, abra **✦ Atividades opcionais** (`J` no PC) e marque uma das seis atividades: fliperama, discos escondidos, circuito da orla, entregas, postal da marina e valet. Nenhuma é necessária para seguir a história; as conclusões e a carteira são salvas separadamente da etapa da campanha.

## Executar

```bash
npm ci
npm run dev
npm run build
```

Requer WebGL 2. **WASD / setas** movem ou dirigem; **Shift** corre (ou abaixa no cassino); **Espaço** pula a pé, abre o paraquedas na queda e freia no carro. **E** interage e **clique esquerdo / X** usa o equipamento quando aplicável. **Segure Ctrl, role e solte** para equipar. A roda mantém o fundo em movimento lento. **Q** abre a roda de rádio, **R** muda de estação, **J** abre atividades e **M** abre o mapa. Clique nele para marcar um destino e ver a rota. A bússola do HUD mostra a direção e a distância ao GPS ou objetivo. **Esc** abre a pausa lateral. Em telas de toque, use o joystick, os botões e ◎.

O cursor fica oculto na cena; a câmera gira com o mouse sem arrastar. **F** alterna a captura do ponteiro, e clique direito recentraliza a câmera. Quem já avançou na história pode escolher **Rejogar prólogo**; isso preserva o checkpoint mais avançado, roupas e atividades.

O cenário 3D usa Three.js. Modos gráficos alteram sombras e resolução, sem mudar a exposição. A rádio tem 22 faixas em cinco estações, incluindo onze gravações de artistas independentes. As falas têm áudio em português e legendas, sem exigir uma voz instalada no aparelho. A estação Aero Mar traz cinco faixas originais de estética Frutiger Aero. O jogo carrega cada gravação quando vai tocá-la. Consulte os [créditos e licenças](public/creditos.html).

## Publicação

O [jogo no GitHub Pages](https://jonataslferreira-hash.github.io/gta6/) é atualizado pelo workflow `.github/workflows/pages.yml` a cada push na `main`. Em **Settings → Pages**, a origem deve ser **GitHub Actions**. Publique a pasta `dist/` gerada por `npm run build`, não os arquivos-fonte do repositório.

Também é possível abrir pelo [endereço alternativo](https://jonataslferreira-hash.github.io/gta6/jogar.html). Após cada publicação, o workflow abre os dois endereços públicos no Chromium e verifica se o menu e as imagens carregam. Para repetir o teste localmente, inicie `npm run preview` após o build e use `npx playwright install chromium` e `npm test`.

Para verificar também os fluxos jogáveis, rode `npm run test:game` com a prévia aberta. O teste cobre a abertura, a roda de equipamento, o mapa, o pulo, o guia, o fliperama, um puzzle de campanha, a rádio, o mouse, o vestiário e os controles em tela de toque. Para testar também a sequência do cassino, o paraquedas, o GPS, a condução e a luz do dia, rode `npm run test:unit`.
