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
    carregarDados(): DadosApp | null {
        try {
            const texto = localStorage.getItem(this.CHAVE_DADOS);
            if (!texto) return null;
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
}
