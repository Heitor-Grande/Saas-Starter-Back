# AGENTS.md — SaaS Starter Backend

## Contexto

Este projeto é o backend do SaaS Starter, um template genérico e reutilizável para o desenvolvimento de aplicações SaaS.

Antes de implementar funcionalidades, consulte o `README.md` para compreender os objetivos e os princípios do projeto.

O desenvolvimento deve seguir rigorosamente os conceitos de **Domain-Driven Design (DDD)**, **Clean Architecture**, **SOLID** e **Clean Code**.

O objetivo é construir uma arquitetura organizada, testável, escalável e independente de regras de negócio específicas.

## Stack

- Node.js
- NestJS
- TypeScript
- PostgreSQL
- Prisma ORM
- Jest

Não introduza novas bibliotecas ou frameworks sem necessidade justificada.

## Arquitetura

O backend deverá seguir uma arquitetura de **monólito modular**, com separação clara entre as camadas:

- **Domain:** entidades, Value Objects, Aggregates, serviços de domínio e contratos de repositórios.
- **Application:** Use Cases, contratos de entrada e saída e orquestração das operações.
- **Infrastructure:** Prisma, persistência, integrações externas e implementações de repositórios.
- **Presentation:** controllers, DTOs HTTP, validação de requisições e respostas da API.

### Regras obrigatórias

1. O domínio não deve depender do NestJS, Prisma ou banco de dados.
2. As regras de negócio devem permanecer nas Entities, Value Objects e Domain Services.
3. Os Use Cases devem coordenar os fluxos da aplicação.
4. Controllers não devem conter regras de negócio.
5. Repositórios devem possuir contratos definidos no domínio.
6. As implementações dos repositórios devem permanecer na infraestrutura.
7. Utilize injeção de dependências para desacoplar as camadas.
8. Evite dependências circulares entre módulos.
9. Não acesse o Prisma diretamente em Controllers ou Use Cases.
10. Respeite os limites e responsabilidades de cada módulo.

## Estrutura do projeto

Utilize a seguinte estrutura como referência:

```text
src/
├── modules/
│   └── example/
│       ├── domain/
│       │   ├── entities/
│       │   ├── value-objects/
│       │   ├── aggregates/
│       │   ├── services/
│       │   └── repositories/
│       ├── application/
│       │   ├── use-cases/
│       │   └── dto/
│       ├── infrastructure/
│       │   └── repositories/
│       ├── presentation/
│       │   ├── controllers/
│       │   └── dto/
│       └── example.module.ts
├── shared/
│   ├── domain/
│   ├── infrastructure/
│   └── utils/
└── main.ts

prisma/
├── schema.prisma
└── migration/
```

A estrutura poderá evoluir conforme as necessidades do projeto, desde que preserve a separação arquitetural.

Não crie arquivos, classes ou diretórios sem necessidade real.

### Organização de utilities

- Todo novo util deve possuir uma pasta própria dentro de `src/util/`, com o mesmo nome do util.
- A pasta de cada util deve conter o arquivo de implementação `.ts` e seu respectivo arquivo de teste `.spec.ts`.
- Exemplo: `src/util/jwt/jwt.ts` e `src/util/jwt/jwt.spec.ts`.

## Domain-Driven Design

### Entities

- Representam objetos com identidade própria.
- Devem encapsular regras e comportamentos do domínio.
- Devem proteger suas invariantes.
- Não devem depender de frameworks ou bibliotecas de persistência.
- Evite entidades que contenham apenas propriedades e getters/setters.

### Value Objects

- Representam conceitos definidos por seus valores.
- Devem ser imutáveis.
- Devem validar suas invariantes.
- Devem implementar igualdade baseada em valores.
- Não devem possuir identidade própria.

### Use Cases

- Cada Use Case deve representar uma operação específica da aplicação.
- Utilize nomes claros, como `CreateUserUseCase`.
- Devem coordenar Entities, Domain Services e repositórios.
- Não devem conter detalhes de HTTP ou persistência.
- Devem ser independentes dos Controllers.

### Domain Services

- Devem encapsular regras de negócio que não pertencem naturalmente a uma Entity ou Value Object.
- Não devem ser utilizados como substitutos genéricos para Use Cases.
- Devem permanecer independentes de detalhes de infraestrutura.

### Repositories

- Defina contratos de repositórios na camada de domínio.
- Implemente os contratos na infraestrutura utilizando Prisma.
- Não exponha modelos ou tipos específicos do Prisma ao domínio.
- Utilize mapeadores quando necessário para converter registros persistidos em objetos de domínio.

### Aggregates

- Utilize Aggregates para estabelecer limites de consistência.
- Defina Aggregate Roots quando necessário.
- Preserve as invariantes do agregado.
- Evite relacionamentos e dependências desnecessárias entre agregados.

## Banco de dados

O banco de dados padrão será o **PostgreSQL**, utilizando o **Prisma ORM**.

### Diretrizes

- Utilize Prisma como mecanismo de acesso e persistência de dados.
- Centralize a configuração do Prisma na infraestrutura.
- Utilize variáveis de ambiente para configurações de conexão.
- Não escreva credenciais diretamente no código.
- Não utilize Prisma diretamente nas camadas Domain e Application.
- Evite consultas duplicadas e acessos desnecessários ao banco.
- Defina relacionamentos, índices e restrições de maneira consistente.
- Utilize transações quando uma operação exigir consistência entre múltiplas alterações.

### Migrations

Deve existir obrigatoriamente a pasta:

`prisma/migration/`

Essa pasta será responsável por armazenar o histórico versionado das alterações estruturais do banco de dados, incluindo criação e modificação de tabelas, índices e relacionamentos.

Regras:

1. Toda alteração estrutural do banco deve possuir uma migration.
2. Não modificar migrations já aplicadas em ambientes compartilhados.
3. Não realizar alterações manuais no banco sem o devido controle de migrations.
4. Manter os modelos do Prisma sincronizados com a estrutura do banco.
5. Utilizar nomes claros para identificar as alterações.
6. Não utilizar sincronização destrutiva do schema como substituto de migrations.

O arquivo `schema.prisma` será responsável pela definição declarativa dos modelos e relacionamentos.

**Observação:** o Prisma utiliza `prisma/migrations/` como diretório padrão. Caso seja adotado o nome personalizado `prisma/migration/`, a configuração e o fluxo de migrations deverão ser compatíveis com a versão utilizada, sem depender de caminhos não suportados.

## APIs e Controllers

- Utilize Controllers do NestJS para expor endpoints REST.
- Mantenha os Controllers simples.
- Utilize DTOs para entrada e saída de dados.
- Valide os dados recebidos nas requisições.
- Utilize códigos HTTP apropriados.
- Padronize o tratamento de erros.
- Não exponha informações sensíveis nas respostas.
- Não retorne diretamente modelos de persistência quando isso comprometer os contratos da API.
- Mantenha os contratos da API independentes das entidades de domínio.

## Testes automatizados

O framework padrão de testes será o **Jest**.

Crie testes automatizados sempre que necessário para garantir o comportamento esperado das funcionalidades.

### Prioridades

- **Entities:** validação de comportamentos e invariantes.
- **Value Objects:** validações, imutabilidade e igualdade.
- **Use Cases:** fluxos de sucesso, falhas e regras de aplicação.
- **Domain Services:** regras e cálculos de negócio.
- **Repositories:** testes de integração quando necessário.
- **Controllers:** testes de comportamento HTTP quando relevante.

### Diretrizes

- Todo arquivo `*.spec.ts` deve ter suas descrições de suítes e casos de teste escritas em português.
- Priorize testes unitários para regras de domínio.
- Utilize mocks para isolar dependências externas.
- Evite testes que dependam de serviços externos desnecessariamente.
- Mantenha os testes legíveis e determinísticos.
- Utilize nomes que descrevam o comportamento esperado.
- Crie ou atualize testes quando alterar regras existentes.
- Não implemente testes apenas para aumentar métricas de cobertura.

## Clean Code e SOLID

- Utilize nomes claros e descritivos.
- Toda função, método ou rota deve possuir, imediatamente antes de sua declaração, um comentário breve que explique por que ela existe, quais parâmetros recebe e o que retorna.
- Mantenha funções e classes com responsabilidades bem definidas.
- Evite duplicação de código.
- Priorize composição em vez de herança desnecessária.
- Utilize interfaces e abstrações quando agregarem valor.
- Evite classes excessivamente grandes.
- Não concentre múltiplas responsabilidades em um único Service.
- Evite comentários que apenas repetem o código.
- Não introduza abstrações prematuras.
- Preserve a legibilidade e a facilidade de manutenção.

## Segurança

- Utilize variáveis de ambiente para informações sensíveis.
- Nunca exponha senhas, tokens ou credenciais.
- Valide dados recebidos externamente.
- Evite registrar informações sensíveis em logs.
- Não armazene senhas em texto puro.
- Utilize mecanismos seguros para autenticação e autorização quando essas funcionalidades forem implementadas.
- Mantenha dependências atualizadas e evite bibliotecas desnecessárias.

## Qualidade e validação

Antes de concluir uma implementação:

1. Verifique os tipos TypeScript.
2. Execute o lint.
3. Execute os testes relevantes.
4. Verifique se a aplicação compila.
5. Confirme que as dependências entre camadas respeitam a arquitetura.
6. Verifique se alterações no banco possuem migrations.
7. Remova imports e códigos desnecessários.
8. Corrija erros introduzidos pela implementação.

Não considere uma funcionalidade concluída caso apresente erros conhecidos.

## Comportamento esperado do Codex

Ao receber uma tarefa:

1. Consulte o `README.md` e as diretrizes deste arquivo.
2. Identifique o módulo e a camada responsáveis pela funcionalidade.
3. Analise os componentes existentes antes de criar novos.
4. Implemente respeitando os conceitos de DDD.
5. Utilize Entities, Value Objects, Use Cases e Domain Services conforme suas responsabilidades.
6. Preserve a independência entre domínio e infraestrutura.
7. Crie migrations quando houver alterações estruturais no banco.
8. Crie ou atualize testes Jest quando necessário.
9. Evite modificar arquivos não relacionados à tarefa.
10. Execute as verificações disponíveis.
11. Informe resumidamente o que foi implementado e quais testes foram executados.

Caso uma solicitação entre em conflito com os princípios arquiteturais definidos, priorize a consistência da arquitetura e apresente a necessidade de ajuste.

## Princípio fundamental

**O SaaS Starter deve possuir uma arquitetura fiel ao DDD, com regras de domínio independentes de frameworks, banco de dados e mecanismos de transporte.**

O NestJS será utilizado como framework de aplicação, o Prisma como mecanismo de persistência e o PostgreSQL como banco de dados.

A arquitetura deverá permanecer organizada, modular, testável e preparada para a evolução de diferentes produtos SaaS.
