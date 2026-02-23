import { Injectable } from '@angular/core';
import { Emprestimo } from '../models/emprestimo.model';
import { CalculadoraEmprestimoService } from './calculadora-emprestimo.service';

/**
 * Classificação de um devedor com nível numérico, rótulo e classes CSS de cor.
 */
export interface NivelDevedor {
    /** Nível numérico: 1 (pior) a 5 (melhor). 0 = sem dados. */
    nivel: number;
    /** Nome legível do nível: 'Risco Elevado', 'Atenção', 'Novo Cliente', 'Bom Pagador', 'Excelente' */
    nome: string;
    /** Classes CSS Tailwind para colorir o badge de nível */
    classesCor: string;
}

/**
 * Serviço responsável pela lógica de análise e classificação de devedores.
 * Utiliza o histórico de empréstimos para determinar o perfil de risco de cada devedor.
 */
@Injectable({
    providedIn: 'root'
})
export class DevedorService {

    constructor(private calculadora: CalculadoraEmprestimoService) { }

    /**
     * Determina o nível (tier) de confiança de um devedor com base no seu histórico.
     *
     * Regras de classificação (em ordem de prioridade):
     * - Risco Elevado (1): mais de 1 empréstimo atrasado atualmente
     * - Atenção (2):        1 empréstimo atrasado OU algum pago com atraso no histórico
     * - Excelente (5):      2 ou mais empréstimos quitados sem atraso
     * - Bom Pagador (4):    1 empréstimo quitado sem atraso
     * - Novo Cliente (3):   nenhum empréstimo quitado ainda
     *
     * @param nomeDevedor Nome do devedor
     * @param todosEmprestimos Lista completa de empréstimos (de todos os devedores)
     * @returns Objeto NivelDevedor com nível, nome e classes de cor
     */
    classificarDevedor(nomeDevedor: string, todosEmprestimos: Emprestimo[]): NivelDevedor {
        // Filtra somente os empréstimos do devedor solicitado
        const emprestimos = todosEmprestimos.filter(e => e.borrowerName === nomeDevedor);

        if (emprestimos.length === 0) {
            return { nivel: 0, nome: 'N/A', classesCor: 'bg-slate-700 text-slate-300' };
        }

        const atrasadosAtualmente = emprestimos.filter(e => this.calculadora.estaAtrasado(e)).length;
        const quitados = emprestimos.filter(e => this.calculadora.estaQuitado(e));
        const tevePagamentoAtrasado = quitados.some(e => this.calculadora.foiPagoComAtraso(e));

        if (atrasadosAtualmente > 1) {
            return { nivel: 1, nome: 'Risco Elevado', classesCor: 'bg-red-100 text-red-700' };
        }
        if (atrasadosAtualmente === 1 || tevePagamentoAtrasado) {
            return { nivel: 2, nome: 'Atenção', classesCor: 'bg-yellow-100 text-yellow-800' };
        }
        if (quitados.length >= 2) {
            return { nivel: 5, nome: 'Excelente', classesCor: 'bg-emerald-100 text-emerald-700' };
        }
        if (quitados.length >= 1) {
            return { nivel: 4, nome: 'Bom Pagador', classesCor: 'bg-green-100 text-green-700' };
        }

        return { nivel: 3, nome: 'Novo Cliente', classesCor: 'bg-blue-100 text-blue-700' };
    }
}
