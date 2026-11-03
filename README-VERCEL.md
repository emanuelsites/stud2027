# Stud PB — Vercel, banco e painel administrativo

Versão Vercel 30, preparada em 03/11/2026 a partir do projeto aprovado v29. A aparência e o conteúdo aprovado foram preservados. Não é necessário o antigo ambiente Sites/Cloudflare para executar esta versão.

## Componentes

- Next.js 16 no runtime Node.js da Vercel.
- Turso/libSQL como banco remoto persistente, compatível com o SQL SQLite entregue. Não é MySQL nem um arquivo SQLite gravado no disco temporário da Vercel.
- Vercel Blob público para as fotografias enviadas no admin. As fotos são públicas; banco, credenciais e backups não são enviados para o Blob.
- Admin próprio em `/admin`, editor visual, editor de pedigree, fichas, galerias, vídeos YouTube e consultas integrados.

## 1. Preparar o banco

Crie um banco novo no Turso e obtenha a URL `libsql://...` e o token de acesso. No computador, use Node.js 24 e abra a pasta que contém package.json:

```sh
npm ci
```

Copie `.env.example` para `.env.local` e preencha:

```dotenv
TURSO_DATABASE_URL=libsql://seu-banco.turso.io
TURSO_AUTH_TOKEN=seu-token
BLOB_READ_WRITE_TOKEN=seu-token-do-blob
```

Importe o banco uma única vez:

```sh
node --env-file=.env.local scripts/import-db.mjs
```

Esse comando importa `database/studpb-producao-2026-11-01.sql`, o backup da versão aprovada com 73 cadastros e ajustes visuais. Ele recusa um banco que já tenha tabelas, para evitar sobrescrever conteúdo existente. Não use esse comando em um banco em produção com dados a preservar.

O banco já contém usuário `admin` e o hash da senha definida anteriormente pelo proprietário. A senha não está em texto aberto no pacote. Sessões antigas não são importadas. O login próprio funciona sem ChatGPT.

## 2. Preparar as fotos

Na Vercel, crie um **Blob store público**, vinculado ao projeto. A variável `BLOB_READ_WRITE_TOKEN` é criada nessa conexão. As imagens já aprovadas estão em `public/assets/` e são publicadas junto com o projeto; não precisam ser reenviadas para o Blob.

O admin e o editor visual fazem novos uploads diretamente ao Blob usando autorização temporária gerada no servidor após validar a sessão. Formatos: PNG, JPEG e WebP, até 10 MB por arquivo. Esse fluxo evita o limite de corpo das Vercel Functions. Nenhum token secreto vai para o JavaScript público.

O callback assinado de upload fica em `/api/blob`. A Vercel precisa conseguir chamar essa rota; se usar Deployment Protection nos previews, faça a validação completa de uploads no domínio de produção acessível. O callback registra os metadados do arquivo. No desenvolvimento local, a imagem é retornada ao editor, mas o callback remoto depende de uma URL acessível pela Vercel Blob.

## 3. Publicar na Vercel

Envie esta pasta para um repositório privado GitHub e importe o repositório pela Vercel, ou use o CLI oficial `vercel` dentro da pasta. O ZIP precisa ser extraído; ele não é um pacote de site estático para arrastar ao painel.

Configuração:

| Campo | Valor |
|---|---|
| Root Directory | Pasta que contém package.json |
| Framework | Next.js |
| Node.js | 24.x |
| Install Command | npm ci |
| Build Command | npm run build |
| Output Directory | Padrão do Next.js, sem personalizar |

Adicione as três variáveis do `.env.example` em **Settings → Environment Variables**, no ambiente de produção e, se quiser testar previews, também em Preview. Nunca envie `.env.local` ao GitHub. Depois publique ou refaça o deploy para aplicar as variáveis.

Não execute a importação do banco dentro do comando de build. Publicações futuras devem reutilizar o mesmo banco e Blob para preservar as alterações do admin.

## 4. Conferir depois de publicar

1. Abrir home, Éguas, Embriões, Gestações e Potros.
2. Entrar em `/admin` com o usuário e a senha já definidos.
3. Editar um texto, salvar e confirmar na página pública.
4. Abrir o editor de pedigree, salvar uma alteração de teste e conferir a ficha.
5. Enviar uma foto pelo admin, salvar a ficha e conferir a imagem pública.
6. Fazer uma edição pelo editor visual e confirmar que ela permanece após recarregar.
7. Exportar o banco no painel e guardar o arquivo em local privado.

O login alternativo por identidade ChatGPT foi removido para não depender de cabeçalhos da plataforma anterior. Nesta entrega o acesso é pela conta admin; a antiga tela de convites por e-mail ChatGPT não aparece.

## Backups e limites da validação

O SQL entregue é o backup de 01/11/2026 da versão aprovada. Ele inclui os cinco novos potros. Não havia uploads R2 nem consultas nesse backup. Os cadastros novos permanecem com os dados não informados em aberto: nascimento/registro dos cinco e sexo de Only Belle e E Belle.

Os backups exportados pelo admin preservam o banco, inclusive URLs das fotos e ajustes visuais, mas não incorporam os bytes de imagens enviadas posteriormente ao Blob. Guarde o armazenamento Blob ao migrar ou restaurar o site. Não coloque os arquivos SQL na pasta public/.

Validações concluídas: build Next.js, TypeScript, importação SQL usando o cliente libSQL real em banco local de teste, 73 cadastros, páginas públicas, login/cookies/CSRF, rejeição de identidade falsificada por cabeçalhos, persistência de catálogo/editor visual, galerias, pedigree, conflitos concorrentes, rollback atômico e exportação/restauração SQL. O envio remoto para Vercel Blob e a conexão com um Turso de produção precisam de suas credenciais e devem ser conferidos após a configuração; não foram simulados como uma publicação real.

## Referências oficiais

- https://vercel.com/docs/frameworks/full-stack/nextjs
- https://vercel.com/docs/vercel-blob/client-upload
- https://vercel.com/docs/functions/limitations
- https://tursodatabase.github.io/libsql-client-ts/
