# Stud PB: execução do relatório e adendo de foto dupla

Padronização posterior aprovada por Sena: todas as composições pai/mãe usam duas metades iguais, quadros de fotografia em 3:2 e nomes abaixo. Imagens em retrato são encaixadas integralmente no quadro, sem cortar o animal. As linhas dos catálogos, potros e matrizes compartilham as alturas de títulos, informações e ações, inclusive em cards sem foto e com nomes longos. Esta decisão substitui a distribuição de larguras proporcional às fotografias descrita anteriormente.

Atualização final de enquadramento em 28/10: revisão visual de 93 imagens usadas por animais e cruzamentos. O preenchimento com cover foi substituído por quadros que acompanham a proporção original das fotos, preservando cabeças, orelhas e membros que existem no arquivo. As composições pai/mãe distribuem a largura proporcionalmente às duas fotografias, mantendo a mesma altura das imagens sem cortes nem faixas artificiais. O ajuste recalcula após carregamento, filtros e substituições pelo CMS. Galerias, cards, matrizes da home, capas e miniaturas também preservam a fotografia. No celular, o banner mostra a imagem inteira e apresenta o texto abaixo. Close-ups e cortes existentes no arquivo de origem permanecem: nenhuma parte do animal foi inventada ou reconstruída.

## Implementado

- Nome comercial separado da genética. Embrião congelado 01 a 07 e Próxima geração 01 a 20 associados aos IDs do relatório. Novos produtos recebem o próximo número por operação atômica no banco; o número não depende da posição do card.
- Nome comercial editável no catálogo e no editor visual. O código aparece no card, H1, modal, busca e mensagem de consulta. Os nomes dos pais e a árvore ficam preservados.
- Foto dupla na home, listagens e fichas de cruzamentos: pai à esquerda, mãe à direita, fotos inteiras e nome em cada lado. Sem foto, o lado correspondente mostra uma mensagem. Nenhum ícone simula fotografia de garanhão.
- Campos Foto do pai e Foto da mãe com upload no admin, persistidos no cadastro. A mãe usa automaticamente a foto de sua ficha quando não existe substituição específica.
- Ofertas vendidas ou com previsão passada ficam fora da seleção comercial da home. As fichas antigas continuam públicas com situação em confirmação e datas preservadas. O admin permite confirmar atividade, nascimento ou encerramento.
- Lulu Way PB com nome limpo, vendido preservado e capa horizontal própria. Capa de Mademoiselle promovida da galeria. As capas verticais anteriores permanecem na galeria.
- Matrizes de destaque editáveis e ordenáveis. Seleção inicial de seis matrizes fotografadas: Balance, Cibelle, HPH Wind Tok, Mademoiselle, Quellanotte e Lika. Os botões de descendentes levam à seção existente da ficha.
- A seção de reprodução explica as modalidades e leva às listagens, evitando repetir os mesmos produtos.
- Submenu duplicado removido; Gestações permanece no menu principal. Breadcrumbs retornam à categoria correta.
- Congelados não exibem sexo ou previsão de nascimento. A árvore pública continua exclusivamente materna.
- URLs comerciais com redirecionamentos 301 dos 27 endereços antigos. Alterações posteriores de slug pelo catálogo criam redirecionamento para o mesmo ID.
- Landing e duas páginas institucionais repetidas arquivadas, com redirecionamento para Nossa história. Registros preservados no banco.
- Textos temporais e superlativos substituídos por resumos factuais baseados na filiação cadastrada. Dez potros receberam resumo, sem alegações esportivas novas. Textos anteriores preservados no acervo `source_records` e no plano comparativo da correção.
- Aba Pendências reúne fotos ausentes, capas verticais, previsões vencidas, divergências genealógicas e revisão editorial. EC Naja e Bhetania têm rascunhos preparados a partir dos cruzamentos, sem publicação automática.
- SQL atualizado inclui estrutura, carga inicial e redirecionamentos. Banco existente recebe a migração 0002 e o backfill separado e idempotente em `lib/corrections.ts`. Comparações preservam fotos/textos posteriormente alterados pela equipe.

## Dados que dependem do Stud

Estes dados não foram inventados nem certificados:

1. Fotos próprias de OH Sophia DC PB, Quanjie du Terme e Clarissa de Will Z.
2. Fotos e confirmação documental de EC Naja e Bhetania antes da publicação dos rascunhos.
3. Fotos dos garanhões ausentes no acervo. Quatro usam fotos que já existiam no site; as demais ausências ficam na aba Pendências.
4. Alternativas horizontais para Eclypse e Guinness. Originais preservados e exibidos inteiros.
5. Situação real das gestações com previsão passada. Em 28/10/2026, 17 previsões do levantamento estão passadas. Não foi inferido nascimento nem avançado artificialmente o ano.
6. Divergência do ano de HPH Wind Tok e da grafia do pai de Lika JT. Avisos e fontes mantidos.
7. WhatsApp oficial, aguardando número fornecido pelo responsável.
8. Aprovação dos resumos e escolha definitiva de destaques comerciais.

## Como concluir no admin

Abrir Pendências e usar Abrir cadastro. Enviar fotos corretas, confirmar previsão/situação, revisar o texto e marcar Texto revisado com o Stud. Para capa substituída, marcar Capa conferida. Destacar na home e Ordem de destaque controlam a seleção; vendidos e gestações vencidas continuam fora da seleção ativa.

Os rascunhos das matrizes só devem ser publicados após conferência. A foto dupla não modifica a regra da árvore dos congelados, que permanece materna.

## Verificação e pacote

Testes cobrem login, papéis, origem das requisições, catálogo, pedigree, editor visual, fotos/vídeos, numeração paralela, conflitos de versão, redirecionamentos, preservação de edições, backfill idempotente e restauração SQL. Revisão em navegador: home, listagens e fichas. Isso não certifica disponibilidade ou resultados esportivos.

O projeto usa SQLite/Cloudflare D1 e R2. O ZIP contém SQL inicial e imagens importadas, sem sessões ou consultas privadas da produção. O backup atualizado de atendimento continua disponível no admin. Não é tema PHP/WordPress nem dump MySQL.
