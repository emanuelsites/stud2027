# Validação da entrega Vercel

## Base incluída

Fonte: aplicação aprovada, versão 36, commit `d150f662011afcaa054590ec245690876d4b7650`, exportação de 04/11/2026.

- 73 cadastros do banco ativo, incluindo rascunhos.
- 63 fichas públicas de animais/cruzamentos com três gerações completas.
- 17 potros na categoria pública.
- 408 referências públicas preservadas.
- Configurações e 30 redirecionamentos preservados.
- Fotografias 16:9 dos cards e capa de Guinness 1920 × 1080.
- Seção repetida “O futuro já tem nome.” removida da home.
- Valores de datas preservados, inclusive 2025 na antiga Próxima geração 19.

## Verificações automatizadas

`npm test` usa o cliente libSQL real conectado a um banco local temporário e executa o servidor da aplicação. Verifica importação, login, hash, cookies, proteção de origem, perfis, revogação de acesso, leitura/gravação, versão concorrente, transação com rollback, editores visual e de pedigree, consultas, exportação/restauração SQL, recuperação de senha e reinstalação sem sobrescrita.

Todas as 63 árvores públicas são percorridas até a terceira geração para confirmar nomes preenchidos. São conferidos os arquivos estáticos referenciados nas páginas públicas, a categoria com 17 potros e a retirada da seção da home. Uploads são testados contra sessão ausente, origem externa, caminho de arquivo inválido e callback sem assinatura, sem acionar um Blob real.

`npm run check` verifica TypeScript. `npm run build` gera o uploader e compila o projeto com Next.js. `node tests/production-http.mjs` inicia o build Next.js de produção com banco temporário e verifica HTTP real: páginas, assets, cookie de login, admin, editor visual, ficha, exportação e bloqueio de acesso aos arquivos do banco.

As 33 conversões WebP sem perdas foram verificadas por igualdade de todos os pixels RGBA e manutenção das dimensões. O pacote estático fica abaixo de 100 MB; os dumps, testes e arquivos da migração são excluídos do envio pelo CLI.

## Limites da validação

Nenhum serviço foi criado ou publicado na conta Vercel/Turso/Blob do cliente. Conexão com banco remoto, upload efetivo ao Blob, callback do provedor, configuração de domínio/DNS e PDF aberto no dispositivo do usuário precisam de homologação após preencher as credenciais. Não houve alteração da publicação de revisão existente nesta entrega.

As validações de layout do site anterior permanecem aplicáveis ao HTML/CSS preservado. Esta entrega verificou funcionalidade e build; não inclui uma nova revisão visual em navegador de todos os tamanhos de tela.
