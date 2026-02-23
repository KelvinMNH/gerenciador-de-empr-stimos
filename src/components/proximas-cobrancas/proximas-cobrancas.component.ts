import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Emprestimo, ProximaCobranca } from '../../models/emprestimo.model';

/**
 * Componente de lista de próximas cobranças.
 * Exibe os pagamentos que vencem em breve com badge de urgência e botão de registrar.
 */
@Component({
    selector: 'app-proximas-cobrancas',
    templateUrl: './proximas-cobrancas.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, CurrencyPipe, DatePipe],
})
export class ProximasCobrancasComponent {
    /** Lista de próximas cobranças calculadas pelo componente raiz */
    @Input({ required: true }) cobrancas!: ProximaCobranca[];

    /** Lista completa de empréstimos (necessária para localizar o empréstimo pelo ID) */
    @Input({ required: true }) todosEmprestimos!: Emprestimo[];

    /** Emitido ao clicar em "Registrar" em uma cobrança específica */
    @Output() registrarPagamento = new EventEmitter<Emprestimo>();

    /**
     * Busca um empréstimo pelo seu ID na lista completa de empréstimos.
     * @param id ID do empréstimo
     * @returns O objeto Emprestimo ou undefined se não encontrado
     */
    buscarEmprestimoPorId(id: number): Emprestimo | undefined {
        return this.todosEmprestimos.find(e => e.id === id);
    }
}
