# Notas pós reunião
## reunião do dia 30-03-2026

### Ideias
- Fazer integração com a api do Gitlab ci para configuração de variaveis
- Gerar a pipeline por API do Gitlab ci
- Converter entre Gitlab CI e Github Actions (sintaxe da pipeline)

### Leads
- verificar a disponibilidade de uma api similar para o github

## reunião do dia 05-04-2026

### Ideias
- exibir o status da pipeline em algum lugar do sistema, para que o usuario possa acompanhar o andamento da pipeline
- mover a configuração do token para o inicio do processo
- puxar pela api do gitlab os projetos disponiveis para o usuario
- popular parte do formulario com informações do projeto selecionado (ex: nome do projeto, linguagem, etc)
- criar um template de pipeline para cada linguagem (ex: java, node, python, etc)
- pensar em uma forma de exibir o template para o usuario, para que ele possa escolher quais etapas deseja incluir na pipeline
- pensar na forma de como será feito a verificação de qualidade do projeto em si, System Usability Scale (SUS) ou uma entrevista estruturada com o cliente

### Leads
- verificar a disponibilidade de uma api similar para o github
- verificar como fazer o template de pipeline para cada linguagem (utilizar IA ou criar manualmente)
- Metodos de verificação de qualidade do projeto (SUS ou entrevista estruturada)