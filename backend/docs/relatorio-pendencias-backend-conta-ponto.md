# Relatório de Pendências --- Backend Conta Ponto

**Data:** 18/11/2026\
**Escopo:** desenvolvimento exclusivo do backend\
**Stack:** Node.js, Express, JavaScript (ES Modules), Prisma ORM e
MySQL.

## 1. Situação geral

A estrutura principal do backend está implementada. Autenticação,
gerenciamento de funcionários, jornadas e parte do registro de ponto já
foram desenvolvidos. O cálculo automático da jornada está em
desenvolvimento e ainda precisa ser validado com dados reais antes de
ser integrado à API.

> **Importante:** este relatório diferencia funcionalidades
> implementadas de funcionalidades efetivamente testadas. Uma
> implementação existente não significa que todos os cenários estejam
> validados.

## 2. Funcionalidades implementadas

### 2.1. Estrutura e infraestrutura

-   [x] Servidor Express e organização modular.
-   [x] Conexão com MySQL por Prisma.
-   [x] Configuração por variáveis de ambiente.
-   [x] CORS, Helmet, Morgan e tratamento centralizado de erros.
-   [x] Rotas principais e endpoint de saúde.
-   [x] Prisma configurado e migrations executadas.

### 2.2. Autenticação e autorização

-   [x] Cadastro de empresa e administrador.
-   [x] Login com e-mail e senha.
-   [x] Hash de senha com bcrypt.
-   [x] Autenticação JWT.
-   [x] Identificação do usuário autenticado.
-   [x] Autorização por perfil ADMIN e EMPLOYEE.
-   [ ] Recuperação e redefinição de senha.

### 2.3. Funcionários

-   [x] Cadastro de funcionários e usuário vinculado.
-   [x] Listagem e consulta individual.
-   [x] Atualização de dados.
-   [x] Ativação e desativação.
-   [x] Restrições por empresa.
-   [ ] Revisão e testes completos de todos os cenários e permissões.

### 2.4. Jornadas de trabalho

-   [x] Cadastro e listagem de jornadas.
-   [x] Consulta e atualização de jornada.
-   [x] Configuração dos dias e horários de trabalho.
-   [x] Cálculo dos minutos previstos.
-   [x] Ativação e desativação.
-   [x] Atribuição de jornada a funcionário.
-   [x] Preservação do histórico: alteração dos horários de jornada
    atribuída é bloqueada; para novos horários deve ser criada outra
    jornada.
-   [ ] Validar casos de atribuições sobrepostas e limites de vigência.

### 2.5. Registro de ponto

-   [x] Estrutura de registros ENTRY, BREAK_START, BREAK_END e EXIT.
-   [x] Endpoint de consulta dos registros do dia.
-   [x] Controle de acesso por perfil nas rotas.
-   [x] Consulta diária testada com perfil administrador.
-   [ ] Testar o fluxo completo de marcação pelo funcionário.
-   [ ] Validar duplicidade, concorrência e tentativas fora de
    sequência.
-   [ ] Definir e implementar o tratamento de registros corrigidos.

## 3. Em andamento --- cálculo automático da jornada

Arquivo: `src/services/workdayCalculationService.js`

A primeira versão do serviço foi revisada e substituída por uma versão
corrigida. A sintaxe foi validada com `node --check`, mas os cálculos
ainda não foram confirmados com dados reais.

### Implementação prevista no serviço

-   [x] Localizar funcionário e empresa.
-   [x] Identificar jornada vigente na data consultada.
-   [x] Buscar registros do dia usando o fuso horário da empresa.
-   [x] Validar a sequência de registros.
-   [x] Calcular períodos trabalhados e intervalo.
-   [x] Calcular atraso e saída antecipada quando houver os registros
    necessários.
-   [x] Evitar apresentar saldo final, déficit e hora extra antes da
    conclusão da jornada.
-   [x] Diferenciar dia sem jornada, dia não iniciado, jornada em
    andamento e jornada concluída.
-   [ ] Executar teste real com funcionário e empresa existentes.
-   [ ] Conferir os resultados com horários conhecidos e cálculos
    manuais.
-   [ ] Testar dia sem jornada e funcionário sem atribuição vigente.
-   [ ] Testar jornadas incompletas e registros inconsistentes.
-   [ ] Testar datas passadas e atuais, inclusive mudança de
    horário/fuso quando aplicável.
-   [ ] Revisar tratamento de jornada sem intervalo e validar as regras
    permitidas pelo negócio.
-   [ ] Integrar o serviço a controller e rota após a validação.

### Dados encontrados no banco durante o teste

-   Empresa: **Nova Obra**
-   `companyId`: **4**
-   Funcionário: **João da Silva Santos**
-   `employeeId`: **1**
-   Código: **FUNC001**

O primeiro teste não encontrou funcionários porque consultava
`companyId = 1`. A empresa cadastrada no banco de desenvolvimento possui
`companyId = 4`. O próximo teste deve usar `employeeId = 1`,
`companyId = 4` e uma data no formato `YYYY-MM-DD`.

## 4. Funcionalidades pendentes

### 4.1. Correções de ponto --- prioridade alta

-   [ ] Funcionário criar solicitação de correção.
-   [ ] Suportar solicitação de inclusão, alteração e remoção.
-   [ ] Exigir justificativa.
-   [ ] Funcionário consultar suas solicitações.
-   [ ] Administrador listar solicitações da empresa.
-   [ ] Administrador aprovar ou rejeitar solicitações.
-   [ ] Registrar responsável, data e observação da análise.
-   [ ] Aplicar correções aprovadas sem apagar indevidamente o histórico
    original.
-   [ ] Recalcular a jornada após uma correção aprovada.

### 4.2. Relatórios --- prioridade alta

-   [ ] Relatório individual por funcionário.
-   [ ] Relatório por período.
-   [ ] Relatório geral da empresa.
-   [ ] Totais de horas trabalhadas e intervalos.
-   [ ] Totais de atrasos e saídas antecipadas.
-   [ ] Horas extras e saldo de jornada.
-   [ ] Filtros por funcionário e período.
-   [ ] Exportação CSV.
-   [ ] Exportação PDF ou Excel, conforme escopo acordado.

### 4.3. Indicadores para dashboard --- prioridade média

-   [ ] Quantidade de funcionários ativos.
-   [ ] Funcionários que ainda não registraram entrada.
-   [ ] Funcionários em expediente.
-   [ ] Funcionários em intervalo.
-   [ ] Funcionários que concluíram a jornada.
-   [ ] Solicitações pendentes de correção.
-   [ ] Indicadores agregados de horas, atrasos e horas extras.

### 4.4. Recuperação de senha --- prioridade média

-   [ ] Endpoint para solicitar recuperação.
-   [ ] Gerar token temporário e seguro.
-   [ ] Armazenar token de forma segura.
-   [ ] Validar expiração e uso único.
-   [ ] Redefinir senha e invalidar o token utilizado.
-   [ ] Definir mecanismo de entrega do token, como e-mail, caso
    aprovado no escopo.

### 4.5. Auditoria --- prioridade média

A estrutura `AuditLog` já existe e algumas operações já registram
eventos. Falta completar e validar a cobertura. - \[ \] Auditar
operações administrativas relevantes. - \[ \] Auditar alterações de
funcionários e jornadas. - \[ \] Auditar solicitações e decisões de
correção. - \[ \] Registrar ator, ação, data e dados pertinentes. - \[
\] Criar endpoints de consulta do histórico. - \[ \] Restringir a
consulta conforme empresa e permissões.

## 5. Segurança, consistência e regras de negócio

-   [ ] Revisar isolamento multiempresa em todos os serviços e
    consultas.
-   [ ] Garantir que funcionário, jornada, atribuição e registro
    pertençam à mesma empresa.
-   [ ] Revisar autorização em todas as rotas.
-   [ ] Validar entradas com Zod.
-   [ ] Tratar concorrência na marcação de ponto para impedir registros
    duplicados.
-   [ ] Revisar expiração e segurança dos tokens.
-   [ ] Revisar logs para não expor senhas, tokens ou dados sensíveis.
-   [ ] Garantir rastreabilidade de correções.
-   [ ] Definir com o cliente regras ainda não especificadas: tolerância
    de atraso, jornadas noturnas, feriados, múltiplos intervalos e
    tratamento de faltas.
-   [ ] Não assumir regras trabalhistas ou de folha de pagamento sem
    validação do escopo.

## 6. Testes e documentação

-   [ ] Criar testes automatizados para serviços e regras de negócio.
-   [ ] Testar rotas de sucesso, validação, autenticação e autorização.
-   [ ] Testar isolamento entre empresas.
-   [ ] Testar cálculos com cenários completos e incompletos.
-   [ ] Testar correções e recálculo.
-   [ ] Testar relatórios e filtros.
-   [ ] Documentar endpoints, parâmetros, exemplos de resposta e erros.
-   [ ] Criar coleção Postman ou Insomnia.
-   [ ] Preparar configuração de produção, migrations e variáveis de
    ambiente.

## 7. Ordem recomendada para concluir

    Ordem Entrega                                      Prioridade
  ------- -------------------------------------------- ------------
        1 Validar cálculo automático com dados reais   Alta
        2 Integrar cálculo em controller e rota        Alta
        3 Implementar solicitações de correção         Alta
        4 Implementar relatórios                       Alta
        5 Implementar indicadores do dashboard         Média
        6 Implementar recuperação de senha             Média
        7 Completar auditoria                          Média
        8 Revisar segurança e testes integrados        Alta
        9 Documentar e preparar implantação            Alta

## 8. Critério de conclusão do backend

O backend poderá ser considerado concluído quando os módulos previstos
estiverem implementados, integrados e testados; as permissões e o
isolamento entre empresas estiverem validados; os cálculos e correções
forem rastreáveis; e a documentação da API estiver disponível.

**Escopo desta etapa:** exclusivamente backend --- banco de dados, API
REST, regras de negócio, autenticação, autorização, validações, testes e
documentação. O desenvolvimento do frontend não faz parte da
responsabilidade desta entrega.
