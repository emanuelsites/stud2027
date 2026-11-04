# Banco Stud PB — 04/11/2026

Cópia do conteúdo atual da aplicação aprovada, versão 36, adaptada para Turso libSQL/SQLite. Contém 73 cadastros, configurações, 30 redirecionamentos, estado do editor visual e 408 registros de referência. Não é MySQL nem um backup privado do WordPress original.

Arquivos equivalentes:

- `content.json`: usado pelo comando `npm run db:setup` do projeto completo, rota recomendada.
- `studpb.sql`: estrutura e dados para importação em banco vazio.
- `studpb.sqlite`: o mesmo conteúdo em arquivo SQLite, pronto para inspeção ou importação no Turso.
- `schema.sql`: somente estrutura, incluindo tabelas do admin e editores.
- `MANIFEST.json`: quantidades e checksums dos arquivos.

**Escolha apenas uma rota de importação.** Não importe o SQL e depois o SQLite no mesmo banco. Não restaure por cima de dados de produção.

O ZIP completo do projeto inclui este banco. Para instalar do zero, configure o `.env.local` do projeto com URL/token do Turso e credenciais iniciais escolhidas pelo responsável; execute `npm ci` e `npm run db:setup`.

As contas, hashes de senha e sessões da hospedagem anterior não foram copiados. Depois de importar diretamente o SQL/SQLite, crie a conta com o comando `npm run admin:password` do projeto completo: defina `ADMIN_USERNAME` e `ADMIN_NEW_PASSWORD` no ambiente local e apague a senha do arquivo depois. O admin fica em `/admin/`.

As imagens atuais estão no ZIP do projeto, em `public/assets/`. Elas precisam acompanhar o site. Novos uploads usam Vercel Blob público e são referenciados no banco por URL; seus bytes não entram no SQL.

Para hospedar na Vercel, conecte um banco Turso remoto. Não coloque o arquivo `.sqlite` como banco gravável da função Vercel. Instruções completas estão no README e em `docs/INSTALACAO-VERCEL.md` do projeto.
