# Vice City — Maré Alta

Jogo de navegador não oficial, inspirado na arte ilustrada de Vice City. O prólogo começa com uma cena contínua dentro do Casino Miragem: veja Luzia e Davi entrando em cena já dentro do cassino, então siga as setas douradas no chão até o primeiro objetivo e as pistas nos bastidores, desative o sensor e não atravesse a linha de visão da segurança. A descoberta e a chegada ao chão usam a mesma cena 3D do jogo. Na queda, mantenha os dois juntos e espere o aviso para abrir o paraquedas após 18 segundos. A fuga percorre cerca de 920 m até o Vestiário Neon.

O modo livre e a campanha após o prólogo permitem trocar de protagonista com **V** (ou **⇄**). Davi tem dois serviços próprios, com entregas em várias áreas. Em Ocean Beach, procure **≈** no mapa para encontrar o jet ski; pilote com WASD e volte ao píer para desembarcar. A praia tem mais gente durante a manhã; quem sai à noite se reúne perto dos clubes. A cidade tem um ciclo de luz de 20 minutos, e a casa do casal, marcada com **⌂**, permite avançar o horário descansando.

**Mouse:** clique no cenário ou pressione **F** para capturar. Use **E** para interagir e o **clique esquerdo** (ou **X**) para usar o equipamento. **F** ou **Esc** solta o ponteiro. O mouse solto nunca gira a câmera. Se a prévia incorporada bloquear a permissão, clique em **Abrir jogo em nova aba** e tente capturar ali. **P** pausa sem precisar soltar o ponteiro primeiro. No mapa, a **roda do mouse** faz zoom embaixo do cursor; os botões **+** e **−** também funcionam por toque.

Ao entrar, abra **✦ Atividades opcionais** (`J` no PC) e marque uma das seis atividades: fliperama, discos escondidos, circuito da orla, entregas, postal da marina e valet. Nenhuma é necessária para seguir a história; as conclusões e a carteira são salvas separadamente da etapa da campanha.

## Executar

```bash
npm ci
npm run dev
npm run build
```

Requer WebGL 2. **WASD / setas** movem ou dirigem; **Shift** corre (ou abaixa no cassino); **Espaço** pula a pé, abre o paraquedas na queda e freia no carro. **E** interage e **clique esquerdo / X** usa o equipamento quando aplicável. **Segure Ctrl, role e solte** para equipar. A roda mantém o fundo em movimento lento. **Q** abre a roda de rádio, **R** muda de estação, **J** abre atividades e **M** abre o mapa. Clique nele para marcar um destino e ver a rota. A bússola do HUD mostra a direção e a distância ao GPS ou objetivo. **Esc** libera o ponteiro ou abre a pausa quando o ponteiro já está livre. Em telas de toque, use o joystick, os botões e ◎.

Quando a captura é confirmada pelo navegador, o cursor fica oculto e a câmera gira sem arrastar. **F** alterna a captura do ponteiro, e clique direito recentraliza a câmera. Quem já avançou na história pode escolher **Rejogar prólogo**; isso preserva o checkpoint mais avançado, roupas e atividades.

O cenário 3D usa Three.js. Use **Ajustes → Vídeo → Brilho da cena** para regular a exposição. Os modos gráficos alteram sombras e resolução independentemente do brilho. O rádio mantém uma posição de transmissão por estação, inclusive enquanto está sintonizado em outra. As falas têm áudio em português e legendas, sem exigir uma voz instalada no aparelho. A estação Aero Mar usa gravações externas licenciadas de clima retrô; não inclui músicas da Nintendo. O jogo carrega cada gravação quando vai tocá-la. Consulte os [créditos e licenças](public/creditos.html).

## Publicação

O [jogo no GitHub Pages](https://jonataslferreira-hash.github.io/gta6/) é atualizado pelo workflow `.github/workflows/pages.yml` a cada push na `main`. Em **Settings → Pages**, a origem deve ser **GitHub Actions**. Publique a pasta `dist/` gerada por `npm run build`, não os arquivos-fonte do repositório.

Também é possível abrir pelo [endereço alternativo](https://jonataslferreira-hash.github.io/gta6/jogar.html). Após cada publicação, o workflow abre os dois endereços públicos no Chromium e verifica se o menu e as imagens carregam. Para repetir o teste localmente, inicie `npm run preview` após o build e use `npx playwright install chromium` e `npm test`.

Para verificar também os fluxos jogáveis, rode `npm run test:game` com a prévia aberta. O teste cobre a abertura, a roda de equipamento, o mapa, o pulo, o guia, o fliperama, um puzzle de campanha, a rádio, o mouse, o vestiário e os controles em tela de toque. Para testar também a sequência do cassino, o paraquedas, o GPS, a condução e a luz do dia, rode `npm run test:unit`.

## Playtest visual

Com a prévia rodando, use `npm run test:visual -- http://localhost:4173/jogar.html`. O Chromium abre o jogo em uma sessão nova, fotografa a cartela, a cena em movimento e o HUD, chega ao primeiro objetivo com teclado real e captura a pausa. `--mobile` emula uma tela de toque; `--city` abre o modo livre para conferir a cidade, o mapa e a pausa. Também é possível passar uma pasta de saída depois da URL.

As imagens e `sessao.json` ficam em `.playtest/` por padrão, fora do Git. O relatório identifica o que estava na tela, erros e quais imagens incluem o HUD. O tempo nele é o do navegador de teste e inclui as capturas; não equivale à duração de uma partida. Não há modo de depuração no jogo publicado: o script usa a interface da prévia.
