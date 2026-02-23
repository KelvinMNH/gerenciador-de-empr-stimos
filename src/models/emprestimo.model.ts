/**
 * Representa um pagamento individual de um empréstimo.
 */
export interface Pagamento {
    /** Valor pago na parcela */
    amount: number;
    /** Data do pagamento (formato ISO string: 'YYYY-MM-DD') */
    date: string;
}

/**
 * Representa um empréstimo completo com todas as suas propriedades.
 */
export interface Emprestimo {
    /** Identificador único gerado via Date.now() */
    id: number;
    /** Nome completo do devedor */
    borrowerName: string;
    /** Valor principal emprestado (sem juros) */
    principal: number;
    /** Taxa de juros mensal em percentual (ex: 5 = 5%) */
    interestRate: number;
    /** Tipo de cálculo de juros: 'simples' ou 'compostos' (Tabela Price) */
    tipoJuros: 'simples' | 'compostos';
    /** Data em que o dinheiro foi emprestado (formato 'YYYY-MM-DD') */
    dateLent: string;
    /** Prazo total do empréstimo em meses */
    paymentTermInMonths: number;
    /** Dia do mês em que a parcela vence (1–30) */
    paymentDay: number;
    /** Histórico de pagamentos realizados */
    payments: Pagamento[];
}

/**
 * Representa um pagamento futuro próximo a vencer para a tela de alertas.
 */
export interface ProximaCobranca {
    /** ID do empréstimo referente */
    loanId: number;
    /** Nome do devedor */
    borrowerName: string;
    /** Data de vencimento da próxima parcela */
    dueDate: Date;
    /** Valor da parcela mensal */
    amount: number;
    /** Número da parcela (ex: 3ª de 12) */
    paymentNumber: number;
    /** Total de parcelas do empréstimo */
    totalPayments: number;
    /** Dias restantes até o vencimento */
    daysRemaining: number;
}

/**
 * Estrutura de dados principal persistida no LocalStorage.
 */
export interface DadosApp {
    /** Lista completa de empréstimos cadastrados */
    loans: Emprestimo[];
    /** Notas/observações por devedor (chave: nome do devedor) */
    borrowerNotes: Record<string, string>;
}
