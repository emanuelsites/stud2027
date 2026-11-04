# Instalação Stud PB na Vercel — Emanuel

## 1. Preparação

Node.js 24.x (testado) ou 22.x ≥ 22.13. Use o diretório que contém `package.json` como raiz do projeto, sem selecionar `public/` como raiz ou saída. O site tem servidor, banco e autenticação; não é um export estático.

Crie no Turso um banco **libSQL** compatível com `@libsql/client`. No painel, copie a URL `libsql://...` e crie um token com acesso de leitura e escrita. Esta distribuição não usa o engine Turso novo com outro SDK; selecione libSQL quando houver escolha.

## 2. Variáveis

Copie `.env.example` para `.env.local` no seu computador. Arquivos de segredo não devem entrar no Git.

| Variável | Onde usar | Valor |
| --- | --- | --- |
| `TURSO_DATABASE_URL` | Local e Vercel | URL do banco libSQL remoto |
| `TURSO_AUTH_TOKEN` | Local e Vercel | Token do banco |
| `SITE_URL` | Local e Vercel | Origem HTTPS do domínio final, sem caminho |
| `ADMIN_INITIAL_USERNAME` | Local, instalação | Ex.: `admin`; 3 a 80 caracteres, letras minúsculas, números, hífen, ponto, sublinhado |
| `ADMIN_INITIAL_PASSWORD` | Local, instalação | Senha de 16 a 200 caracteres, escolhida pelo responsável |
| `ADMIN_INITIAL_EMAIL` | Local, opcional | E-mail do responsável |
| `BLOB_READ_WRITE_TOKEN` | Vercel; local para uploads | Criada ao conectar um store Vercel Blob público |

Para trabalhar localmente sem Turso, use `TURSO_DATABASE_URL=file:./data/studpb-dev.db`, token vazio e `SITE_URL=http://localhost:3000`. A pasta `data/` está incluída. Isso serve apenas para desenvolvimento; na Vercel configure o banco remoto.

## 3. Importar os dados atuais

```sh
npm ci
npm run db:setup
```

O comando cria as tabelas e importa, em transação, os 73 registros, configurações, 30 redirecionamentos, estado do editor visual e 408 referências. Cria a conta inicial usando hash com salt. Não usa a senha da conta da hospedagem anterior.

A exportação atual não tinha consultas, uploads ou registros de auditoria adicionais. Todos os arquivos de imagem em uso estão em `public/`. Três textos longos foram recuperados integralmente da fonte versionada após verificar correspondência exata com o prefixo retornado pelo banco; detalhes em `database/content.json > export_metadata`.

Se o banco já contém cadastros, a instalação preserva esses registros. Não use `db:setup` para restaurar por cima de um banco existente. Use um banco vazio para restauração. Para um banco criado a partir de `studpb.sqlite` ou `studpb.sql`, o conteúdo já existe: crie a conta com `npm run admin:password`, usando as variáveis de recuperação descritas no README.

## 4. Build e implantação

```sh
npm run check
npm test
npm run build
```

Importe o repositório na Vercel ou use o Vercel CLI na pasta do projeto. Não versionar `node_modules/`, `.next/`, `.env.local`, `backups/` ou dados de teste. O arquivo `.vercelignore` evita enviar o dump e arquivos de migração na implantação pelo CLI. As 33 fotografias PNG grandes foram convertidas para WebP sem perdas, preservando pixels e dimensões, para manter os arquivos enviados abaixo de 100 MB. O app importa somente a carga original necessária às migrações idempotentes, não lê o dump editorial do disco no runtime.

Configuração Vercel:

- Framework: Next.js.
- Root Directory: pasta que contém `package.json`.
- Install: `npm ci`.
- Build: `npm run build`.
- Output: padrão Next.js, sem customização.
- Node: 24.x ou 22.x.
- Variáveis Production: URL/token Turso, `SITE_URL`, token Blob.

O banco deve ser preparado antes da primeira visita. Não coloque `db:setup` como comando de build; previews/deploys não devem modificar conteúdo de produção. Para Preview, prefira outro banco e outro Blob, com `SITE_URL` da prévia. As URLs automáticas de deployment/branch Vercel são reconhecidas na proteção de origem.

## 5. Fotografias novas

Na Vercel, crie/conecte um Blob store com acesso **public**. A integração configura `BLOB_READ_WRITE_TOKEN`. Reimplante depois.

O uploader incluído em `public/admin-upload.js` é recompilado no build a partir de `scripts/upload-client.ts`. Ele exige sessão do painel para gerar autorização; os bytes seguem diretamente ao Blob. O token é limitado a imagens e 10 MB. O callback é validado pelo SDK e registra a mídia depois de conferir tamanho e assinatura do arquivo.

Esse mecanismo atende upload de capa, galeria, fotos dos pais e editor visual. Os vídeos continuam sendo links do YouTube, não upload de MP4. Um Blob público sem token configurado não afeta as imagens antigas incluídas no projeto, mas impede novos uploads pelo admin.

No ambiente local, use uma URL pública de callback/túnel conforme a documentação oficial do Blob para testar a confirmação. O caminho mais simples para homologar upload é uma implantação Preview com banco e Blob de testes.

## 6. Conferência depois de publicar

1. Abra home, catálogo de embriões, gestações e potros, ficha de Guinness e uma ficha de Uricas.
2. Entre em `/admin/` com a conta criada.
3. Edite um rascunho e salve. Confira a persistência ao recarregar.
4. Envie uma imagem pequena no rascunho; confira a imagem e seu registro no Blob.
5. Confira editor visual, salvar pedigree e exportar PDF.
6. Envie uma consulta de teste e confira a aba Consultas.
7. Faça backup SQL e guarde-o em local privado.
8. Conecte o domínio final, atualize `SITE_URL` e reimplante. A publicação anterior de revisão não é desligada por este pacote.

Não há envio automático de e-mail nesta versão: o formulário grava as consultas no painel; WhatsApp/e-mail funcionam pelos links configurados.

## 7. Backup e restauração

O painel fornece `/api/export.sql` apenas para administradores. O comando `npm run db:export` faz uma leitura consistente em transação, não depende do limite de resposta HTTP e salva em `backups/`. Os backups operacionais incluem hashes das contas, nunca sessões; trate-os como arquivos privados.

Para restaurar, escolha um banco libSQL vazio e importe **um** SQL de backup ou o arquivo SQLite pelo Turso. Depois atualize URL/token na Vercel e reimplante. Não importe apenas o schema seguido de um dump que tente recriar tabelas de outra versão. O dump desta distribuição contém `CREATE ... IF NOT EXISTS` e os registros correspondentes à estrutura entregue.

Novas imagens no Blob precisam de cópia/backup separado; o SQL contém os links. Os arquivos atuais estão no ZIP do projeto completo.

## Referências oficiais consultadas

- Next.js Route Handlers: https://nextjs.org/docs/app/getting-started/route-handlers
- Turso TypeScript/libSQL: https://docs.turso.tech/sdk/ts/reference
- Importação Turso: https://docs.turso.tech/cli/db/create
- Vercel Blob e uploads do navegador: https://vercel.com/docs/vercel-blob/client-upload
- Limites das funções Vercel: https://vercel.com/docs/functions/limitations
- Node.js na Vercel: https://vercel.com/docs/functions/runtimes/node-js/node-js-versions
