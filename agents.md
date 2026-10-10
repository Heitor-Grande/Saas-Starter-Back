# AGENTS.md — SaaS Starter Backend

## Contexto

Este projeto é o backend do SaaS Starter, um template genérico e reutilizável para aplicações SaaS.

Antes de implementar funcionalidades, consulte o `README.md` e siga as convenções deste arquivo.

O projeto utiliza a organização modular padrão do NestJS. Não utilize DDD, Clean Architecture, Use Cases, Entities ou contratos de repositório sem uma necessidade explicitamente aprovada.

## Stack

- Node.js
- NestJS
- TypeScript
- PostgreSQL
- `pg`
- Jest

Não introduza novas bibliotecas ou frameworks sem necessidade justificada.

## Arquitetura

Cada funcionalidade deve ficar em um módulo NestJS independente e simples.

```text
src/
├── modules/
│   └── example/
│       ├── dto/
│       │   └── create-example.dto.ts
│       ├── example.controller.ts
│       ├── example.controller.spec.ts
│       ├── example.service.ts
│       ├── example.service.spec.ts
│       └── example.module.ts
├── middleware/
├── shared/
│   └── infrastructure/
├── util/
└── main.ts
```

### Responsabilidades

- **Controller:** recebe requisições, extrai parâmetros, chama o Service e monta a resposta HTTP.
- **Service:** concentra validações, regras da funcionalidade e acesso ao banco de dados.
- **Module:** registra Controllers, Services e dependências do módulo.
- **DTO:** define os formatos de entrada e saída da funcionalidade.
- **Shared:** mantém infraestrutura compartilhada, como a conexão PostgreSQL.
- **Middleware:** trata comportamentos HTTP compartilhados antes das rotas.

### Regras obrigatórias

1. Mantenha Controllers simples e sem consultas SQL.
2. Mantenha consultas PostgreSQL nos Services ou em componentes de infraestrutura quando houver reutilização real.
3. Utilize injeção de dependências do NestJS.
4. Utilize DTOs para entradas e saídas.
5. Evite dependências circulares entre módulos.
6. Não crie camadas, interfaces ou abstrações sem necessidade real.
7. Registre cada novo módulo no módulo responsável pela aplicação.

## Utilities

- Todo novo util deve possuir uma pasta própria dentro de `src/util/`, com o mesmo nome do util.
- A pasta deve conter o arquivo de implementação `.ts` e seu arquivo de teste `.spec.ts`.
- Exemplo: `src/util/jwt/jwt.ts` e `src/util/jwt/jwt.spec.ts`.

## Banco de dados

O banco padrão é PostgreSQL, acessado com a biblioteca `pg`.

- Utilize o `postgresPool` centralizado em `src/shared/infrastructure/database/postgres/`.
- Utilize parâmetros posicionais, como `$1` e `$2`, em todas as consultas.
- Nunca monte SQL concatenando valores recebidos externamente.
- Utilize variáveis de ambiente para a conexão.
- Utilize transações quando uma operação exigir consistência entre múltiplas alterações.
- Evite consultas duplicadas e acessos desnecessários ao banco.
- Não exponha detalhes ou erros internos do PostgreSQL ao cliente.

### Migrations

As migrations ficam em `docs/migration/`.

1. Cada tabela deve possuir seu próprio arquivo SQL.
2. Toda alteração estrutural deve possuir uma migration.
3. Não altere migrations já aplicadas em ambientes compartilhados.
4. Mantenha tipos, índices e constraints consistentes com o código.
5. Execute o arquivo de chaves estrangeiras após a criação das tabelas.

## APIs e Controllers

- Utilize Controllers do NestJS para endpoints REST.
- Valide todos os dados recebidos.
- Utilize códigos HTTP apropriados.
- Utilize `createApiResponse` para padronizar as respostas.
- Ao responder manualmente, utilize `return response` na mesma instrução que chama `status` e `json`.
- Não exponha informações sensíveis nem erros internos.
- Utilize o usuário autenticado pelo JWT para dados de auditoria; não aceite esse identificador livremente do cliente.
- O payload JWT padrão deve conter `usuarioid` numérico, `datalogin` em formato ISO e `organizacaoid` numérico; não utilize a propriedade `sub`.

## Testes automatizados

O framework padrão é Jest.

- Todo arquivo `*.spec.ts` deve ter descrições de suítes e casos de teste em português.
- Priorize testes unitários para Services, Controllers e utilities.
- Utilize mocks para isolar banco e serviços externos.
- Não crie testes que apenas confirmem o comportamento de um mock sem validar regra ou resultado relevante.
- Mantenha os testes legíveis e determinísticos.
- Crie ou atualize testes quando alterar comportamentos existentes.
- Não implemente testes apenas para aumentar cobertura.

## Clean Code e SOLID

- Utilize nomes claros e descritivos.
- Toda função, método ou rota deve possuir imediatamente antes de sua declaração um comentário breve explicando por que existe, quais parâmetros recebe e o que retorna.
- Mantenha funções e classes com responsabilidades bem definidas.
- Evite duplicação de código.
- Evite classes excessivamente grandes.
- Evite comentários que apenas repetem o código.
- Não introduza abstrações prematuras.

## Segurança

- Utilize variáveis de ambiente para informações sensíveis.
- Nunca exponha senhas, tokens ou credenciais.
- Valide dados recebidos externamente.
- Evite registrar informações sensíveis em logs.
- Não armazene senhas em texto puro.
- Utilize consultas parametrizadas.
- Proteja rotas privadas com o middleware JWT.

## Qualidade e validação

Antes de concluir uma implementação:

1. Verifique os tipos TypeScript.
2. Execute o lint.
3. Execute os testes relevantes.
4. Verifique se a aplicação compila.
5. Confirme que os módulos seguem a estrutura padrão do NestJS.
6. Verifique se alterações no banco possuem migrations.
7. Remova imports e códigos desnecessários.
8. Corrija erros introduzidos pela implementação.

Não considere uma funcionalidade concluída caso apresente erros conhecidos.

## Comportamento esperado do Codex

1. Consulte o `README.md` e este arquivo.
2. Analise os componentes existentes antes de criar novos.
3. Implemente a menor estrutura necessária usando o padrão do NestJS.
4. Evite modificar arquivos não relacionados à tarefa.
5. Crie ou atualize testes relevantes.
6. Execute tipos, lint, testes e build.
7. Informe resumidamente o que foi implementado e validado.

## Princípio fundamental

**O SaaS Starter deve permanecer modular, simples, legível e alinhado aos padrões do NestJS, sem camadas arquiteturais desnecessárias.**
