# Vice City — Maré Alta

Jogo de navegador não oficial, inspirado no clima tropical e na arte ilustrada de Vice City. O primeiro capítulo de Luzia tem quatro missões com testes de frenagem, investigação de pistas e painéis interativos. A exploração livre tem ambientações de entardecer e noite no mesmo mapa.

Ao entrar, abra **✦ Atividades opcionais** (`J` no PC) e marque uma das seis atividades: fliperama, discos escondidos, circuito da orla, entregas, postal da marina e valet. Nenhuma é necessária para seguir a história; as conclusões e a carteira são salvas separadamente da etapa da campanha.

## Executar

```bash
npm ci
npm run dev
npm run build
```

Requer navegador com WebGL 2. No teclado: **WASD / setas** para mover ou dirigir, **Shift** para correr, **Espaço** para frear, **E** para interagir, **R** para trocar a estação, **J** para o guia da cidade, **M** para o mapa e **Esc** para pausar. Arraste a cena para girar a câmera. Dispositivos com ponteiro primário de toque mostram o joystick e botões na tela.

Esta edição guarda checkpoints em um novo save; o progresso da campanha original não é sobrescrito.

O cenário 3D usa Three.js. Modos gráficos alteram sombras e resolução, sem mudar a exposição. A rádio tem 17 faixas em quatro estações, incluindo onze gravações de artistas independentes. As falas têm áudio em português e legendas, sem exigir uma voz instalada no aparelho. O jogo carrega cada faixa quando vai tocá-la. Consulte os [créditos e licenças](public/creditos.html).

## Publicação

O [jogo no GitHub Pages](https://jonataslferreira-hash.github.io/gta6/) é atualizado pelo workflow `.github/workflows/pages.yml` a cada push na `main`. Em **Settings → Pages**, a origem deve ser **GitHub Actions**. Publique a pasta `dist/` gerada por `npm run build`, não os arquivos-fonte do repositório.

Também é possível abrir pelo [endereço alternativo](https://jonataslferreira-hash.github.io/gta6/jogar.html). Após cada publicação, o workflow abre os dois endereços públicos no Chromium e verifica se o menu e as imagens carregam. Para repetir o teste localmente, inicie `npm run preview` após o build e use `npx playwright install chromium` e `npm test`.

Para verificar também os fluxos jogáveis, rode `npm run test:game` com a prévia aberta. O teste cobre a abertura, o guia, o fliperama, um puzzle de campanha, a rádio e os controles em tela de toque.
