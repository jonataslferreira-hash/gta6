# Vice City — Maré Alta

Jogo de navegador não oficial, inspirado no clima tropical e na arte ilustrada de Vice City. O primeiro capítulo de Luzia tem quatro missões com fuga de carro, investigação e painéis interativos. A história começa na orla, minutos depois de um assalto ao cassino em que Luzia e Davi levam a mala errada. A câmera chega ao enquadramento de direção no mesmo carro e entrega o controle ao jogador, com dicas contextuais de aceleração, curva, freio e saída do veículo. As cutscenes são em 3D, com planos próximos, expressões animadas e avanço automático pela dublagem. A exploração livre tem ambientações de entardecer e noite no mesmo mapa.

Ao entrar, abra **✦ Atividades opcionais** (`J` no PC) e marque uma das seis atividades: fliperama, discos escondidos, circuito da orla, entregas, postal da marina e valet. Nenhuma é necessária para seguir a história; as conclusões e a carteira são salvas separadamente da etapa da campanha.

## Executar

```bash
npm ci
npm run dev
npm run build
```

Requer navegador com WebGL 2. No teclado: **WASD / setas** para mover ou dirigir, **Shift** para correr, **Espaço** para frear, **E** ou **clique esquerdo** para interagir, **Q** ou **rodela** para abrir a roda de estações, **R** para avançar a estação, **F** para travar/liberar o cursor, **J** para o guia da cidade, **M** para o mapa e **Esc** para pausar. No PC, mova o mouse sem clicar para olhar e use o botão direito para recentralizar. Em telas de toque, arraste a cena e use o botão ◎ para acessar a roda. O **Vestiário Neon** fica em Ocean Beach, ao lado do fliperama, e salva a roupa escolhida.

Quem ainda não avançou na campanha pode jogar o novo prólogo. Os checkpoints da campanha criminal, roupas e atividades concluídas são preservados. No mapa, procure as paradas da orla: jukebox, Café na Janela e Mercado do Porto.

O cenário 3D usa Three.js. Modos gráficos alteram sombras e resolução, sem mudar a exposição. A rádio tem 17 faixas em quatro estações, incluindo onze gravações de artistas independentes. As falas têm áudio em português e legendas, sem exigir uma voz instalada no aparelho. O jogo carrega cada faixa quando vai tocá-la. Consulte os [créditos e licenças](public/creditos.html).

## Publicação

O [jogo no GitHub Pages](https://jonataslferreira-hash.github.io/gta6/) é atualizado pelo workflow `.github/workflows/pages.yml` a cada push na `main`. Em **Settings → Pages**, a origem deve ser **GitHub Actions**. Publique a pasta `dist/` gerada por `npm run build`, não os arquivos-fonte do repositório.

Também é possível abrir pelo [endereço alternativo](https://jonataslferreira-hash.github.io/gta6/jogar.html). Após cada publicação, o workflow abre os dois endereços públicos no Chromium e verifica se o menu e as imagens carregam. Para repetir o teste localmente, inicie `npm run preview` após o build e use `npx playwright install chromium` e `npm test`.

Para verificar também os fluxos jogáveis, rode `npm run test:game` com a prévia aberta. O teste cobre a abertura, a transição para a direção, o primeiro arco da fuga, o guia, o fliperama, um puzzle de campanha, a rádio, o mouse, o vestiário e os controles em tela de toque. Para testar as colisões e a seleção radial separadamente, rode `npm run test:unit`.
