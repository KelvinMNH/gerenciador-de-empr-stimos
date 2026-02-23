import { Injectable } from '@angular/core';
import { Emprestimo } from '../models/emprestimo.model';

/**
 * Serviço responsável por todos os cálculos financeiros relacionados a empréstimos.
 * Centraliza a lógica de juros, parcelas, datas de vencimento e status de atraso,
 * mantendo o componente principal livre de regras de negócio financeiras.
 */
@Injectable({
    providedIn: 'root'
})
export class CalculadoraEmprestimoService {

    /**
     * Calcula o valor da parcela mensal de acordo com o tipo de juros do empréstimo.
     *
     * - **Juros Simples**: Total = P × (1 + i × n); Parcela = Total / n
     * - **Juros Compostos** (Tabela Price): PMT = PV × [i × (1+i)^n] / [(1+i)^n - 1]
     *
     * Empréstimos antigos sem `tipoJuros` usam compostos por retrocompatibilidade.
     * @param emprestimo Empréstimo a ser calculado
     * @returns Valor da parcela mensal em reais
     */
    calcularParcelaMensal(emprestimo: Emprestimo): number {
        const principal = emprestimo.principal;
        const taxaMensal = emprestimo.interestRate / 100;
        const numeroParcelas = emprestimo.paymentTermInMonths;

        // Sem juros: parcela igual independente do tipo
        if (taxaMensal === 0) {
            return principal / numeroParcelas;
        }

        // Juros Simples: total fixo dividido pelo prazo
        if (emprestimo.tipoJuros === 'simples') {
            const total = principal * (1 + taxaMensal * numeroParcelas);
            return total / numeroParcelas;
        }

        // Juros Compostos (Tabela Price)
        const numerador = taxaMensal * Math.pow(1 + taxaMensal, numeroParcelas);
        const denominador = Math.pow(1 + taxaMensal, numeroParcelas) - 1;
        if (denominador === 0) return principal / numeroParcelas;
        return principal * (numerador / denominador);
    }

    /**
     * Calcula o valor total a ser pago ao longo de todo o empréstimo (principal + juros).
     * Para empréstimos sem juros, retorna apenas o principal.
     * @param emprestimo Empréstimo a ser calculado
     * @returns Valor total devido (com juros)
     */
    calcularTotalDevido(emprestimo: Emprestimo): number {
        if (emprestimo.interestRate === 0) return emprestimo.principal;
        return this.calcularParcelaMensal(emprestimo) * emprestimo.paymentTermInMonths;
    }

    /**
     * Soma todos os pagamentos já realizados para um empréstimo.
     * @param emprestimo Empréstimo a ser consultado
     * @returns Total já pago em reais
     */
    calcularTotalPago(emprestimo: Emprestimo): number {
        return emprestimo.payments.reduce((soma, p) => soma + p.amount, 0);
    }

    /**
     * Retorna quantas parcelas foram pagas.
     * Se o empréstimo estiver quitado (saldo devedor ≤ R$ 0,01), retorna o total
     * de parcelas diretamente — evitando erros de arredondamento do Math.floor
     * quando o usuário fez pagamentos irregulares ou em valor ligeiramente diferente
     * da parcela calculada.
     * @param emprestimo Empréstimo a ser consultado
     * @returns Número inteiro de parcelas completadas
     */
    calcularParcelasPagas(emprestimo: Emprestimo): number {
        // Se quitado, todas as parcelas devem aparecer como pagas
        if (this.estaQuitado(emprestimo)) {
            return emprestimo.paymentTermInMonths;
        }
        const parcela = this.calcularParcelaMensal(emprestimo);
        if (parcela <= 0.01) return 0;
        const totalPago = this.calcularTotalPago(emprestimo);
        const parcelasPagas = Math.floor(totalPago / parcela);
        return Math.min(parcelasPagas, emprestimo.paymentTermInMonths);
    }

    /**
     * Calcula o saldo devedor restante (o que ainda falta pagar).
     * @param emprestimo Empréstimo a ser consultado
     * @returns Saldo devedor em reais
     */
    calcularSaldoDevedor(emprestimo: Emprestimo): number {
        return this.calcularTotalDevido(emprestimo) - this.calcularTotalPago(emprestimo);
    }

    /**
     * Calcula o percentual de progresso das parcelas pagas (0 a 100).
     * Usado para renderizar a barra de progresso nos cards.
     * @param emprestimo Empréstimo a ser calculado
     * @returns Percentual de parcelas concluídas (0–100)
     */
    calcularProgressoParcelas(emprestimo: Emprestimo): number {
        if (emprestimo.paymentTermInMonths <= 0) return 0;
        return (this.calcularParcelasPagas(emprestimo) / emprestimo.paymentTermInMonths) * 100;
    }

    /**
     * Calcula a data de vencimento da última parcela do empréstimo.
     * Considera o dia de pagamento configurado e ajusta para o último dia do mês se necessário.
     * @param emprestimo Empréstimo a ser consultado
     * @returns Data de vencimento final (objeto Date UTC)
     */
    calcularDataVencimentoFinal(emprestimo: Emprestimo): Date {
        const dataInicio = new Date(emprestimo.dateLent);
        dataInicio.setUTCHours(0, 0, 0, 0);

        const mesAlvo = dataInicio.getUTCMonth() + emprestimo.paymentTermInMonths;
        const anoAlvo = dataInicio.getUTCFullYear() + Math.floor(mesAlvo / 12);
        const mesF = mesAlvo % 12;

        // Ajusta o dia para o último dia do mês, se necessário
        const diasNoMes = new Date(Date.UTC(anoAlvo, mesF + 1, 0)).getUTCDate();
        const diaPagamento = Math.min(emprestimo.paymentDay, diasNoMes);

        return new Date(Date.UTC(anoAlvo, mesF, diaPagamento));
    }

    /**
     * Calcula a data de vencimento da próxima parcela pendente.
     * Retorna null se todas as parcelas já foram pagas.
     * @param emprestimo Empréstimo a ser consultado
     * @returns Próxima data de vencimento ou null se quitado
     */
    calcularProximoVencimento(emprestimo: Emprestimo): Date | null {
        const parcelasPagas = this.calcularParcelasPagas(emprestimo);
        if (parcelasPagas >= emprestimo.paymentTermInMonths) {
            return null; // Todas as parcelas pagas
        }

        const proximaParcela = parcelasPagas + 1;
        const dataInicio = new Date(emprestimo.dateLent);
        dataInicio.setUTCHours(0, 0, 0, 0);

        const mesAlvo = dataInicio.getUTCMonth() + proximaParcela;
        const anoAlvo = dataInicio.getUTCFullYear() + Math.floor(mesAlvo / 12);
        const mesF = mesAlvo % 12;

        const diasNoMes = new Date(Date.UTC(anoAlvo, mesF + 1, 0)).getUTCDate();
        const diaPagamento = Math.min(emprestimo.paymentDay, diasNoMes);

        return new Date(Date.UTC(anoAlvo, mesF, diaPagamento));
    }

    /**
     * Calcula os detalhes de atraso de um empréstimo: dias de atraso, multa e total a pagar.
     * Regra de penalidade: multa fixa de 2% + 0,1% ao dia de juros por atraso.
     * @param emprestimo Empréstimo a ser analisado
     * @returns Objeto com { diasAtraso, multa, totalDevido }
     */
    calcularDetalhesAtraso(emprestimo: Emprestimo): { diasAtraso: number; multa: number; totalDevido: number } {
        if (this.estaQuitado(emprestimo)) {
            return { diasAtraso: 0, multa: 0, totalDevido: 0 };
        }

        const proximoVencimento = this.calcularProximoVencimento(emprestimo);
        if (!proximoVencimento) {
            return { diasAtraso: 0, multa: 0, totalDevido: 0 };
        }

        const hoje = new Date();
        hoje.setUTCHours(0, 0, 0, 0);

        const parcela = this.calcularParcelaMensal(emprestimo);

        // Ainda dentro do prazo
        if (hoje <= proximoVencimento) {
            return { diasAtraso: 0, multa: 0, totalDevido: parcela };
        }

        const diferenca = hoje.getTime() - proximoVencimento.getTime();
        const diasAtraso = Math.max(0, Math.floor(diferenca / (1000 * 3600 * 24)));

        // Cálculo da multa: 2% fixo + 0,1% por dia de atraso
        const multaFixa = parcela * 0.02;
        const jurosDiarios = parcela * 0.001 * diasAtraso;
        const multa = multaFixa + jurosDiarios;
        const totalDevido = parcela + multa;

        return { diasAtraso, multa, totalDevido };
    }

    /**
     * Verifica se um empréstimo está completamente quitado.
     * Usa margem de R$ 0,01 para evitar problemas de arredondamento de ponto flutuante.
     * @param emprestimo Empréstimo a verificar
     * @returns true se o saldo devedor for menor ou igual a R$ 0,01
     */
    estaQuitado(emprestimo: Emprestimo): boolean {
        return this.calcularSaldoDevedor(emprestimo) <= 0.01;
    }

    /**
     * Verifica se um empréstimo quitado foi pago com atraso.
     * Compara a data do último pagamento com a data de vencimento final.
     * @param emprestimo Empréstimo a verificar (deve estar quitado)
     * @returns true se o último pagamento foi após a data de vencimento final
     */
    foiPagoComAtraso(emprestimo: Emprestimo): boolean {
        if (!this.estaQuitado(emprestimo) || emprestimo.payments.length === 0) {
            return false;
        }
        const ultimoPagamento = new Date(Math.max(...emprestimo.payments.map(p => new Date(p.date).getTime())));
        const vencimento = this.calcularDataVencimentoFinal(emprestimo);

        ultimoPagamento.setUTCHours(0, 0, 0, 0);
        vencimento.setUTCHours(0, 0, 0, 0);

        return ultimoPagamento > vencimento;
    }

    /**
     * Verifica se um empréstimo está atrasado com base nos dias de atraso calculados.
     * @param emprestimo Empréstimo a verificar
     * @returns true se houver pelo menos 1 dia de atraso
     */
    estaAtrasado(emprestimo: Emprestimo): boolean {
        return this.calcularDetalhesAtraso(emprestimo).diasAtraso > 0;
    }
}
