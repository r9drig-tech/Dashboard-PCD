# 📊 Dashboard de RH com PCD

> Projeto de análise de dados de Recursos Humanos com foco em **inclusão de Pessoas com Deficiência (PCD)**, utilizando dados simulados e um dashboard web interativo.

---

## 📊 Visualização do Dashboard

Este é o painel principal do projeto **Dashboard de Inclusão PCD**, desenvolvido com Antigravity IDE.  
Ele apresenta indicadores de inclusão, headcount, salário médio, e cumprimento da cota legal (Lei 8.213/91).

![Dashboard de Inclusão PCD](dashboard_pcd.png)


---
## 📋 Descrição

Este projeto realiza a extração, transformação e visualização de indicadores estratégicos de Recursos Humanos de uma empresa fictícia, com ênfase no cumprimento da **cota legal de PCD (Lei 8.213/91)**.

Os dados são provenientes de uma planilha Excel simulada e exportados automaticamente para arquivos CSV. O dashboard é construído com HTML, CSS e JavaScript puro, utilizando a biblioteca **Chart.js** para renderização de gráficos interativos.

---

## 🗂️ Estrutura do Projeto

```
Dashboard PCD/
│
├── 01_gestao_pessoas_simulado.xlsx   # Base de dados simulada (Excel)
├── export_csv.py                     # Script Python para exportar os dados para CSV
├── README.md                         # Este arquivo
│
└── Dashboard_RH/                     # Pasta do dashboard web
    ├── index.html                    # Interface principal do dashboard
    ├── style.css                     # Estilos premium (tema escuro)
    ├── app.js                        # Lógica de filtros, KPIs e gráficos (Chart.js)
    │
    ├── Colaboradores.csv             # Cadastro de 35 colaboradores (ativos e desligados)
    ├── Movimentações.csv             # Histórico de 27 admissões e desligamentos
    ├── KPIs Mensais.csv              # KPIs mensais de Jan/2024 a Dez/2024
    └── Resumo PCD.csv                # Distribuição de colaboradores por tipo de deficiência
```

---

## 📈 Principais Indicadores

| Indicador | Descrição |
|---|---|
| **Headcount Total** | Número de colaboradores ativos no período selecionado |
| **Salário Médio** | Média salarial geral e por departamento |
| **Admissões** | Contagem de novas contratações no período |
| **Desligamentos** | Contagem de demissões/saídas no período |
| **Taxa de Turnover** | `(Desligamentos / Headcount Final) × 100` |
| **% Cota PCD** | Percentual de colaboradores PCD sobre o total ativo |
| **Comparativo PCD vs Não-PCD** | Salário médio, tempo de empresa e taxa de desligamento |
| **Evolução PCD** | Histórico mensal de crescimento do quadro PCD |
| **Distribuição por Deficiência** | Auditiva, Visual, Motora, Intelectual, Múltipla |

> **Cota Legal:** A Lei 8.213/91 determina que empresas com 100 ou mais empregados devem preencher de 2% a 5% de seus cargos com PCD habilitados.

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Uso |
|---|---|
| **Python 3.13+** | Script de extração e limpeza dos dados do Excel |
| **Pandas** | Leitura e transformação das planilhas Excel |
| **OpenPyXL** | Suporte à leitura de arquivos `.xlsx` pelo Pandas |
| **HTML5 / CSS3** | Estrutura e estilos do dashboard (tema dark premium) |
| **JavaScript (ES6+)** | Lógica de filtros, cálculos e interatividade |
| **Chart.js** | Gráficos interativos (linhas, barras, rosca) via CDN |
| **Google Fonts** | Tipografia premium (`Inter` e `Outfit`) |
| **Antigravity IDE** | Ambiente de desenvolvimento assistido por IA |

---

## 🚀 Como Executar

### Pré-requisitos

- [Python 3.x](https://www.python.org/downloads/) instalado
- Biblioteca `pandas` e `openpyxl` instaladas

### Passo 1 — Instalar Dependências

```bash
pip install pandas openpyxl
```

### Passo 2 — Exportar os Dados para CSV

Execute o script Python na raiz do projeto para criar a pasta `Dashboard_RH` com os arquivos CSV:

```bash
python export_csv.py
```

Saída esperada:
```
Diretório 'Dashboard_RH' criado com sucesso.

--- RESUMO DA EXPORTAÇÃO ---
Total de arquivos CSV gerados: 4
- Arquivo criado: Colaboradores.csv (35 registros exportados)
- Arquivo criado: Movimentações.csv (27 registros exportados)
- Arquivo criado: KPIs Mensais.csv (12 registros exportados)
- Arquivo criado: Resumo PCD.csv (6 registros exportados)
----------------------------
```

### Passo 3 — Iniciar o Servidor Local

O dashboard carrega os arquivos CSV via `fetch()`, portanto **precisa de um servidor HTTP local** (não abre diretamente como arquivo).

```bash
python -m http.server 8000 --directory Dashboard_RH
```

### Passo 4 — Acessar o Dashboard

Abra o navegador e acesse:

```
http://localhost:8000
```

---

## 🖥️ Funcionalidades do Dashboard

- **Filtros de Período:** Mensal, Trimestral e Anual
- **Filtro por Departamento:** RH, TI, Projetos, Financeiro, Jurídico, Operações, Marketing, Comercial
- **Filtro por Status PCD:** Todos / Apenas PCD / Apenas Não-PCD
- **Pesquisa de Colaboradores:** Campo de busca em tempo real na tabela de detalhamento
- **Exportação:** Exportar a tabela filtrada como arquivo CSV
- **Modo Demonstração:** Toggle para simular afastamentos e visualizar impacto nos indicadores

---

## 📊 Departamentos e Líderes

| Departamento | Líder Responsável | Cargo |
|---|---|---|
| RH | Ana Lima | Supervisor |
| TI | Bernardo Lima | Gerente |
| Projetos | Nathan Pereira | Gerente |
| Financeiro | Yasmin Faria | Gerente |
| Jurídico | Zé Cardoso | Supervisor |
| Operações | Quintino Dias | Gerente |
| Marketing | Julia Nunes | Supervisor |
| Comercial | João Batista | Supervisor |

---

## 📄 Licença

Este projeto está licenciado sob a **Licença MIT**.

```
MIT License

Copyright (c) 2026 r9drig-tech

Permissão é concedida, gratuitamente, a qualquer pessoa que obtenha uma cópia deste software e dos arquivos de
documentação associados (o “Software”),para lidar com o Software sem restrições, incluindo, sem limitação,
os direitos de usar, copiar, modificar, mesclar, publicar, distribuir,
sublicenciar e/ou vender cópias do Software, e permitir que pessoas às
quais o Software seja fornecido o façam, sujeito às seguintes condições:

O aviso de copyright acima e este aviso de permissão deverão ser incluídos em todas as cópias ou
partes substanciais do Software.

O SOFTWARE É FORNECIDO “NO ESTADO EM QUE SE ENCONTRA”, SEM QUALQUER GARANTIA DE QUALQUER TIPO,
EXPRESSA OU IMPLÍCITA, INCLUINDO,
MAS NÃO SE LIMITANDO ÀS GARANTIAS DE COMERCIALIZAÇÃO, ADEQUAÇÃO A UM PROPÓSITO ESPECÍFICO E NÃO VIOLAÇÃO.
EM NENHUMA CIRCUNSTÂNCIA OS AUTORES OU DETENTORES DOS DIREITOS AUTORAIS SERÃO RESPONSÁVEIS POR QUALQUER REIVINDICAÇÃO,
DANO OU OUTRA RESPONSABILIDADE,
SEJA EM UMA AÇÃO DE CONTRATO, DELITO OU DE OUTRA FORMA, DECORRENTE DE OU RELACIONADA AO SOFTWARE
OU AO USO OU OUTRAS NEGOCIAÇÕES RELACIONADAS AO SOFTWARE.
```

---

> Desenvolvido por **r9drig-tech** | Powered by **Antigravity IDE**
