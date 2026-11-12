# Stud PB — entrega aprovada em 12/11/2026

Este pacote contém o site completo, o painel administrativo, o editor de pedigree, o editor visual, as fotos e uma exportação do banco atualizado. O código foi adaptado para Next.js na Vercel, com banco Turso/libSQL e Vercel Blob para novos uploads.

## Conteúdo da entrega

- `app/`, `lib/` e `public/` — código, painel e mídias do site.
- `database/content.json` — dados usados pelo importador.
- `database/studpb.sql` — exportação SQL compatível com SQLite/libSQL.
- `database/studpb.sqlite` — cópia do banco pronta para consulta local.
- `database/schema.sql` — estrutura das tabelas.
- `.env.example` — nomes das variáveis necessárias.
- `package-lock.json` — versões de dependências fixadas para instalação com `npm ci`.

O banco contém 99 cadastros, incluindo publicados e arquivados. As correções aprovadas de potros e gestações estão incluídas. Os oito novos potros e suas fotografias fazem parte do pacote. A seção de gestações contém 17 fichas correspondentes aos 13 cruzamentos distintos conferidos.

## 1. Preparar o banco

Crie um banco vazio no Turso e obtenha a URL e um token com acesso de leitura e escrita. O painel do Turso está em https://app.turso.tech/.

Na pasta do projeto, com Node.js 22 e npm instalados, execute:

```bash
npm ci
cp .env.example .env.local
```

Edite `.env.local` e preencha:

```dotenv
TURSO_DATABASE_URL=libsql://SEU-BANCO.turso.io
TURSO_AUTH_TOKEN=SEU-TOKEN
BLOB_READ_WRITE_TOKEN=SEU-TOKEN-DO-VERCEL-BLOB
```

Importe o banco aprovado:

```bash
npm run db:import
```

O comando confirma a importação dos 99 cadastros. A importação é feita em uma transação e recusa um banco que já contenha cadastros. Execute a importação uma única vez, antes da primeira publicação na Vercel. Nas próximas publicações, o banco preserva as alterações feitas no admin.

## 2. Preparar as fotos na Vercel

Crie um armazenamento **Vercel Blob público**, conecte-o ao projeto e obtenha `BLOB_READ_WRITE_TOKEN`. As fotos existentes já estão incluídas em `public/`, incluindo as oito imagens enviadas após a última versão do código. O token é necessário para enviar novas imagens pelo admin.

Os novos uploads aceitam JPEG, PNG e WebP de até 4 MB, para caber no limite das funções da Vercel. As imagens enviadas ficam persistidas no Blob e suas URLs são gravadas no banco.

Documentação do serviço: https://vercel.com/docs/vercel-blob.

## 3. Publicar na Vercel

Extraia o ZIP e use a pasta `StudPB-Vercel` como raiz do projeto. Suba seu conteúdo para um repositório Git privado e importe esse repositório na Vercel. Use a integração com Git para este pacote. O conjunto de fotos ultrapassa o limite de 100 MB de envio pela CLI no plano Hobby. Consulte https://vercel.com/docs/limits#static-file-uploads.

- Framework — Next.js.
- Node.js — 22.x.
- Install Command — `npm ci`.
- Build Command — `npm run build`.
- Output Directory — padrão do Next.js, sem configuração manual.

Cadastre no ambiente Production as três variáveis de `.env.example`. Se usar um ambiente de Preview, configure um banco e um Blob próprios para ele. Use variáveis com esses mesmos nomes, sem o prefixo `NEXT_PUBLIC_`.

Faça o deploy. Em seguida, teste `/`, `/potros`, `/gestacoes`, `/embrioes` e `/admin` no novo domínio. Configure o domínio do Stud PB no projeto da Vercel após a revisão.

## 4. Acessar o painel

O painel fica em `/admin` e o usuário atual é **admin**. A mesma senha cadastrada no site aprovado é preservada por meio de seu hash. O pacote contém o cadastro do administrador, sem a senha em texto aberto. As sessões do domínio anterior precisam de um novo login.

O admin permite editar fichas, fotos, status de venda, pedigree, conteúdo visual e configurações, além de exportar o banco. O login usa usuário e senha do próprio Stud PB. Na aba Equipe, o administrador pode definir uma senha para cada e-mail e atribuir o perfil de editor ou administrador. Contas antigas vinculadas ao ChatGPT precisam receber uma senha nessa aba para acessar o painel na Vercel.

Se for necessário redefinir a senha, configure temporariamente `ADMIN_USERNAME` e `ADMIN_PASSWORD` no `.env.local` da máquina de manutenção, com uma senha de pelo menos 12 caracteres, e execute:

```bash
npm run admin:password
```

Depois remova `ADMIN_PASSWORD` do arquivo local. Esse comando altera a senha no banco configurado e encerra as sessões anteriores desse usuário.

## 5. Conferir localmente

Para uma revisão local sem serviços externos, use uma cópia do banco incluído:

```bash
mkdir -p data
cp database/studpb.sqlite data/studpb.sqlite
```

Configure `TURSO_DATABASE_URL=file:./data/studpb.sqlite` em `.env.local` e deixe `TURSO_AUTH_TOKEN` vazio. Execute `npm run dev`. A opção de arquivo é destinada ao desenvolvimento local. Na Vercel, configure a URL remota do Turso.

Para executar o build local de produção:

```bash
npm run typecheck
npm run build
node --env-file=.env.local node_modules/next/dist/bin/next start
```

## Verificações desta entrega

Foram verificados o build de produção, a importação dos 99 cadastros, as páginas públicas, as duas datas corrigidas, o login, a leitura e gravação pelo admin, o bloqueio de alterações concorrentes, o editor de pedigree, as permissões da equipe, o contexto do editor visual, a exportação SQL, o encerramento de sessão e o carregamento das oito fotos novas.

O upload para uma conta real do Vercel Blob e o deploy no projeto Vercel do Stud PB dependem das credenciais dessa conta e devem ser conferidos após a configuração. O pacote usa o banco aprovado exportado em 12/11/2026. Os itens de conteúdo que ficaram para revisão posterior, incluindo matrizes e a lista do estoque de embriões congelados, continuam conforme a versão aprovada.

Os arquivos de banco são backups privados do projeto e devem ficar fora da pasta `public/`. O diretório `public/` contém apenas arquivos destinados aos visitantes do site.
