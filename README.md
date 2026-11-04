# Stud PB — projeto completo para Vercel

Entrega de 04/11/2026. Base editorial copiada da versão 36 do site aprovado, incluindo a retirada da seção repetida “O futuro já tem nome.” da home, as fotografias 16:9 dos pais, Guinness de La Violle em 1920 × 1080 e o preenchimento dos pedigrees.

## Arquitetura desta entrega

- **Site e servidor:** Next.js 16, TypeScript e Node.js 22 ou 24.
- **Banco persistente:** Turso **libSQL**, compatível com SQLite; conexão remota por `@libsql/client`. Não é MySQL.
- **Novos uploads:** Vercel Blob, store **público**, envio direto do navegador de imagens PNG/JPEG/WebP até 10 MB.
- **Imagens atuais:** incluídas em `public/assets/`, servidas pela própria Vercel. As 33 PNGs grandes com ganho de compressão foram convertidas para WebP sem perdas, sem corte nem redimensionamento; os pixels foram comparados integralmente. Mapa e checksums em `docs/ASSETS-WEB.json`.
- **Admin:** `/admin/`, login próprio com usuário e senha; não depende de ChatGPT ou Cloudflare.

O banco precisa ser remoto na Vercel. O arquivo SQLite entregue é uma cópia para inspeção, backup ou importação; ele não é usado como banco gravável dentro de uma função serverless. O código recusa esse uso na Vercel.

## Publicar

1. Crie um banco **libSQL** no Turso e obtenha a URL e um token com permissão de escrita.
2. Extraia este ZIP e abra o terminal na pasta que contém `package.json`.
3. Copie `.env.example` para `.env.local`. Preencha `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `ADMIN_INITIAL_PASSWORD` (16 a 200 caracteres) e `SITE_URL`. Escolha o usuário inicial em `ADMIN_INITIAL_USERNAME`.
4. Execute:

```sh
npm ci
npm run db:setup
npm run build
```

5. Suba a pasta em um repositório Git privado e importe o repositório na Vercel. Ou execute o Vercel CLI **na pasta extraída**, com `vercel`, configure as variáveis e depois publique com `vercel --prod`. A Vercel faz o build; não se envia o ZIP diretamente como site estático.
6. Na Vercel, escolha o framework **Next.js**, Node.js **24.x** ou **22.x**, comando de instalação `npm ci`, build `npm run build` e saída padrão do framework. Configure `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` e `SITE_URL` no ambiente Production. Não copie tokens no código nem use prefixo `NEXT_PUBLIC_`.
7. Crie um **Vercel Blob público**, conecte-o ao projeto e confirme a variável `BLOB_READ_WRITE_TOKEN`. Reimplante depois de adicionar variáveis.
8. Abra `/admin/` no domínio publicado e entre com o usuário e a senha que você definiu no passo 3.

O primeiro `db:setup` importa a cópia editorial e cria a conta inicial. Executá-lo novamente em banco com cadastros preserva o conteúdo existente. A senha inicial é usada pelo comando local de instalação; não é necessário mantê-la como variável na Vercel. Não execute importação do banco no build de cada deploy.

**Guia detalhado:** [docs/INSTALACAO-VERCEL.md](docs/INSTALACAO-VERCEL.md).

## O que está incluído

- Home e catálogo; éguas, embriões, gestações, 17 potros, notícias, institucional e contato.
- **73 cadastros** atuais, incluindo rascunhos e páginas; **63 fichas públicas** de animais/cruzamentos com três gerações completas; 408 registros de referência arquivados.
- Admin para cadastros, fotos/galerias, vídeos YouTube, consultas, configurações e equipe.
- Editor visual com alterações persistidas e editor de pedigree com exportação JSON/PDF.
- Perfis administrador/editor, hash PBKDF2 com salt, sessões revogáveis, cookie HttpOnly/Secure/SameSite, limitação de login, proteção de origem e verificação de versão das edições.
- Backup SQL pelo painel e pelo comando `npm run db:export`.
- SQL, SQLite e JSON da cópia editorial em `database/`; imagens e identidade visual em `public/`.

Datas de nascimento/previsão foram preservadas. A previsão 2025 da antiga “Próxima geração 19” continua como solicitada. Os embriões mantêm o pedigree materno. As fontes de genealogia estão indicadas nas fichas, com a exceção ABCCH via BrazHorse identificada para Regina Metodo.

## Comandos

| Comando | Função |
| --- | --- |
| `npm run db:setup` | Criar estrutura e importar conteúdo em banco vazio, criar admin |
| `npm run dev` | Desenvolvimento local |
| `npm run build` | Bundle do uploader e build Next.js |
| `npm start` | Executar o build de produção localmente |
| `npm test` | Integração usando banco libSQL local temporário |
| `npm run check` | Verificação TypeScript |
| `node tests/production-http.mjs` | Verificação HTTP do build de produção, depois do build |
| `npm run admin:password` | Recuperar senha e revogar sessões da conta |
| `npm run db:export` | Backup SQL consistente do banco configurado, em `backups/` |

## Banco e contas

`database/content.json` é a fonte da instalação. `database/studpb.sql` e `database/studpb.sqlite` são cópias equivalentes para importação/inspeção. `database/schema.sql` contém a estrutura. **Escolha uma rota de importação, não importe os três arquivos no mesmo banco.** A rota recomendada é `npm run db:setup` em um banco vazio.

Nenhuma senha, hash de conta da hospedagem anterior, sessão ou token de serviço foi copiado para esta entrega. As contas da Vercel são criadas com as credenciais que você definir. A equipe passa a usar usuário e senha próprios, gerenciados na aba Equipe. A autenticação ChatGPT anterior foi substituída.

Para recuperar a conta, preencha apenas no `.env.local` local:

```dotenv
ADMIN_USERNAME=admin
ADMIN_NEW_PASSWORD=sua-nova-senha-com-pelo-menos-16-caracteres
```

Execute `npm run admin:password` e apague `ADMIN_NEW_PASSWORD` do arquivo depois. As sessões antigas são encerradas.

## Validação e limites

Build Next.js e TypeScript aprovados. Integração com libSQL local valida autenticação, permissões, gravação, transações, editores, exportação/restauração e as 63 árvores públicas. O teste HTTP verifica o servidor Next.js real. Veja [docs/VALIDACAO.md](docs/VALIDACAO.md).

Não foi feito deploy na sua conta Vercel nem conexão com Turso/Blob reais, pois esta entrega não inclui suas credenciais desses serviços. O upload remoto e seu retorno assinado devem ser conferidos depois da configuração. No desenvolvimento local, a confirmação de upload do Blob exige uma URL pública de callback; a documentação da Vercel explica esse fluxo.

O pacote não é um backup privado do WordPress original. Contém a aplicação aprovada e seus dados atuais, imagens usadas e metadados de referência. O arquivo da migração pública original está em `migration/`.

Mantenha backups do banco e do Blob. O SQL registra URLs das mídias, não os bytes de novos uploads. Para bancos que ultrapassem o limite de resposta de uma função Vercel, use `npm run db:export` no computador administrativo em vez do download pelo painel.
