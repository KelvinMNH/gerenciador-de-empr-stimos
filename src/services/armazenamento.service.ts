import { Injectable } from '@angular/core';
import { DadosApp } from '../models/emprestimo.model';

/**
 * Serviço responsável por toda a persistência de dados no LocalStorage do navegador.
 * Garante que os dados de empréstimos e notas sejam salvos e recuperados de forma segura.
 */
@Injectable({
    providedIn: 'root'
})
export class ArmazenamentoService {
    /** Chave usada para armazenar os dados principais no LocalStorage */
    private readonly CHAVE_DADOS = 'loan-manager-data';
    /** Chave usada para armazenar o timestamp do último backup exportado */
    private readonly CHAVE_TIMESTAMP = 'loan-manager-export-timestamp';

    /**
     * Salva todos os dados da aplicação (empréstimos e notas) no LocalStorage.
     * É chamado automaticamente pelo efeito reativo do componente raiz a cada mudança de estado.
     * @param dados Objeto contendo a lista de empréstimos e as notas dos devedores
     */
    salvarDados(dados: DadosApp): void {
        try {
            localStorage.setItem(this.CHAVE_DADOS, JSON.stringify(dados));
        } catch (e) {
            console.error('Erro ao salvar os dados no LocalStorage:', e);
        }
    }

    /**
     * Carrega os dados da aplicação a partir do LocalStorage.
     * Valida a estrutura básica antes de retornar para evitar erros com dados corrompidos.
     * Aplica migração automática para empréstimos antigos que não possuem o campo `tipoJuros`.
     * @returns O objeto DadosApp ou null se não existir / estiver inválido
     */
    carregarDados(): DadosApp {
        try {
            const texto = localStorage.getItem(this.CHAVE_DADOS);
            if (!texto) {
                const dadosDemo = this.gerarDadosDemonstracao();
                this.salvarDados(dadosDemo);
                return dadosDemo;
            }
            const dados: DadosApp = JSON.parse(texto);
            // Validação básica da estrutura
            if (dados && Array.isArray(dados.loans) && typeof dados.borrowerNotes === 'object') {
                // Migração: garante que empréstimos antigos (sem tipoJuros) usem 'compostos'
                dados.loans = dados.loans.map(e => ({
                    ...e,
                    tipoJuros: e.tipoJuros ?? 'compostos',
                }));
                return dados;
            }
            return null;
        } catch (e) {
            console.error('Erro ao carregar os dados do LocalStorage:', e);
            return null;
        }
    }

    /**
     * Salva o timestamp (em ms) do último backup exportado pelo usuário.
     * @param timestamp Timestamp Unix em milissegundos (Date.now())
     */
    salvarTimestampExportacao(timestamp: number): void {
        try {
            localStorage.setItem(this.CHAVE_TIMESTAMP, timestamp.toString());
        } catch (e) {
            console.error('Erro ao salvar o timestamp no LocalStorage:', e);
        }
    }

    /**
     * Carrega o timestamp do último backup exportado.
     * @returns O timestamp em ms ou null se nunca foi feito backup
     */
    carregarTimestampExportacao(): number | null {
        try {
            const texto = localStorage.getItem(this.CHAVE_TIMESTAMP);
            if (!texto) return null;
            const ts = parseInt(texto, 10);
            return isNaN(ts) ? null : ts;
        } catch (e) {
            console.error('Erro ao carregar o timestamp do LocalStorage:', e);
            return null;
        }
    }

    /**
     * Remove completamente todos os dados da aplicação do LocalStorage.
     * Ação irreversível — utilizada apenas na função "Limpar Todos os Dados".
     */
    limparTudo(): void {
        try {
            localStorage.removeItem(this.CHAVE_DADOS);
            localStorage.removeItem(this.CHAVE_TIMESTAMP);
        } catch (e) {
            console.error('Erro ao limpar os dados do LocalStorage:', e);
        }
    }

    /**
     * Gera dados de demonstração para que o usuário veja
     * a aplicação preenchida no primeiro acesso.
     * Retorna 3 empréstimos: 1 novo, 1 parcialmente pago e 1 totalmente pago.
     */
    private gerarDadosDemonstracao(): DadosApp {
        const hoje = new Date();
        const ha2Meses = new Date(hoje); ha2Meses.setMonth(hoje.getMonth() - 2);
        const ha5Meses = new Date(hoje); ha5Meses.setMonth(hoje.getMonth() - 5);

        const formatarData = (d: Date) => d.toISOString().split('T')[0];

        return {
            loans: [
                {
                    id: Date.now() - 3,
                    borrowerName: 'Carlos Silva (Exemplo Pago)',
                    principal: 1000,
                    interestRate: 5,
                    tipoJuros: 'simples',
                    dateLent: formatarData(ha5Meses),
                    paymentTermInMonths: 4,
                    paymentDay: 10,
                    payments: [
                        { amount: 300, date: formatarData(new Date(ha5Meses.getFullYear(), ha5Meses.getMonth() + 1, 10)) },
                        { amount: 300, date: formatarData(new Date(ha5Meses.getFullYear(), ha5Meses.getMonth() + 2, 10)) },
                        { amount: 300, date: formatarData(new Date(ha5Meses.getFullYear(), ha5Meses.getMonth() + 3, 10)) },
                        { amount: 300, date: formatarData(new Date(ha5Meses.getFullYear(), ha5Meses.getMonth() + 4, 10)) },
                    ]
                },
                {
                    id: Date.now() - 2,
                    borrowerName: 'Maria Oliveira (Exemplo Parcial)',
                    principal: 2000,
                    interestRate: 8,
                    tipoJuros: 'compostos',
                    dateLent: formatarData(ha2Meses),
                    paymentTermInMonths: 10,
                    paymentDay: 15,
                    payments: [
                        { amount: 298.06, date: formatarData(new Date(ha2Meses.getFullYear(), ha2Meses.getMonth() + 1, 15)) },
                    ]
                },
                {
                    id: Date.now() - 1,
                    borrowerName: 'João Santos (Exemplo Novo)',
                    principal: 500,
                    interestRate: 10,
                    tipoJuros: 'simples',
                    dateLent: formatarData(hoje),
                    paymentTermInMonths: 5,
                    paymentDay: 5,
                    payments: []
                }
            ],
            borrowerNotes: {
                'Maria Oliveira (Exemplo Parcial)': 'Cliente tem comércio local, costuma pagar em dinheiro.',
                'Carlos Silva (Exemplo Pago)': 'Excelente pagador, quitou em dia.'
            }
        };
    }
}
