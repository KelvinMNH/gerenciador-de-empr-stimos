# Gerenciador de Empréstimos (Versão Demonstração para Portfólio)

**Versão Demo**: Este repositório contém uma versão de demonstração do **Gerenciador de Empréstimos**, um projeto web desenvolvido para compor meu portfólio pessoal. O objetivo principal é demonstrar minhas habilidades com **Angular 21**, **Tailwind CSS**, tipagem com **TypeScript**, gerenciamento de estado e estruturação arquitetural de aplicações front-end.

A aplicação é um sistema de controle de empréstimos pessoais. Ela permite cadastrar empréstimos, registrar pagamentos, acompanhar atrasos e analisar o perfil de cada devedor, tudo de forma interativa e com feedback em tempo real na interface.

**Persistência de Dados**: Todas as informações ficam salvas localmente no navegador, utilizando o `localStorage`, demonstrando o uso de persistência client-side. Em um cenário real de produção, esta camada de dados estaria conectada a uma API e um banco de dados relacional.

---

## Destaques do Projeto e Aprendizados

- **Recursos do Angular 21**: Aproveitando as novidades do Angular, como **Signals** para um controle de reatividade simples e eficiente, e a nova sintaxe de controle de fluxo (`@if` / `@for`).
- **UI/UX e Componentização**: Interface responsiva, limpa e moderna implementada utilizando **Tailwind CSS**. Foco na componentização para garantir o reaproveitamento de código em modais e cards, mantendo uma estrutura altamente modular.
- **Lógica de Negócios (Calculadora Financeira)**: Implementação 100% no front-end do cálculo de amortização **Price**, gestão de mora, aplicação de juros diários automáticos sobre atrasos e consolidação de dívidas totais por cliente.
- **Padrão Arquitetural**: Clara separação de responsabilidades (SRP - Single Responsibility Principle). **Models** contêm as tipagens estritas, **Services** isolam a complexa camada de regras de negócios e os **Components** atuam apenas na camada de apresentação e interações diretas com o usuário.

---

## Resumo das Funcionalidades

| Funcionalidade | Descrição Técnica |
|---|---|
| **Cadastro de contratos** | Definição de cliente, capital, taxa (% a.m.), prazo de quitação e vencimento. |
| **Cálculo de parcelas** | Motor que processa amortização com juros compostos garantindo a integridade dos cálculos. |
| **Baixa de pagamentos** | Aceita e realiza o abatimento de saldos tanto de forma total quanto de forma parcial, recalculando o valor restante. |
| **Detecção de inadimplência** | Identifica atrasos no carregamento da aplicação, aplicando multa fixa e efetuando o repasse de juros proporcionais ao período (pro-rata die). |
| **Próximas cobranças** | Algoritmo de cruzamento, filtragem e ordenação cronológica para facilitar acompanhamento e cobranças das parcelas ativas. |
| **Avaliação de risco** | Sistema que ranqueia automaticamente os devedores usando um padrão de *Tier* baseado puramente em histórico e comportamento de crédito na ferramenta. |
| **Exportação de Dados** | Uso da poderosa `FileReader` API e `Blob` para exportar o objeto global local e re-importar todo o estado da aplicação via JSON. |

---

## Execução Local

Caso haja interesse em testar localmente, o repositório foi construído para rápida execução e deploy na máquina do avaliador.

1. **Faça o clone do repositório:**
```bash
git clone https://github.com/SEU_USUARIO/gerenciador-de-emprestimos.git
cd gerenciador-de-emprestimos
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Inicie o servidor de desenvolvimento:**
```bash
npm run dev
```

4. Acesse através do navegador no endereço [http://localhost:4200](http://localhost:4200).

---

## Arquitetura e Organização de Pastas

Para manter o fluxo previsível, de fácil leitura e manutenção no longo prazo, a estrutura do projeto foi idealizada refletindo a sua lógica modular:

```text
src/
├── models/
│   └── emprestimo.model.ts         # Interfaces TS garantindo os type guards (Loan, Payment, AppData)
├── services/
│   ├── calculadora.service.ts      # Motor de matemática financeira: mora, juros da parcela e descontos
│   ├── devedor.service.ts          # Algoritmo definidor do score e risco de pagamento do cliente
│   └── storage.service.ts          # Abstração da integração I/O via LocalStorage
├── components/
│   ├── card-emprestimo/            # Componente reutilizável para listagem em grid
│   ├── detalhe-emprestimo/         # Painel que atua como extrato detalhado da transação atual
│   ├── perfil-devedor/             # Histórico, anotações de cobrança e consolidação financeira do cliente
│   ├── proximos-pagamentos/        # Widget dinâmico de leitura rápida de cobranças a vencer
│   ├── ... modais (log-payment, add-loan, settings)
├── app.component.ts                # App State Manager (Signals) - controla a orquestração de visão
└── app.component.html              # Layout de Container base usando injeção de micro/macro componentes
```

---

## Detalhamento Técnico: Amortização Utilizada

Para apurar as parcelas a serem pagas, o Service utiliza a fórmula **Tabela Price** (também conhecida como Sistema Francês de Amortização), bastante presente na cultura de empréstimos do mercado:

```text
PMT = PV × [ i × (1 + i)^n ] / [ (1 + i)^n - 1 ]

Onde:
PMT = Valor matemático constante da parcela mensal
PV  = Valor base original do Empréstimo (Capital/Present Value)
i   = Taxa de juros (%) em valor decimal (dividida por 100)
n   = Número total de meses/períodos estabelecidos no contrato
```

---

## Tecnologias e Ferramentas

- **Angular 21**
- **TypeScript**
- **Tailwind CSS**
- **HTML5 & Web APIs**

---

## Disclaimer de Privacidade

Este projeto possui caráter educativo e de **demonstração técnica como Case Study**. Quaisquer informações que venham a ser inseridas, alteradas ou cadastradas na interface (tais como nomes de clientes fictícios ou valores hipotéticos) ficam resguardadas rigorosamente **offline no dispositivo local do avaliador**, pois a aplicação age exclusivamente de forma Client-Side.
