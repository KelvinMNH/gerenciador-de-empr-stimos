import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Emprestimo } from '../../models/emprestimo.model';
import { CalculadoraEmprestimoService } from '../../services/calculadora-emprestimo.service';

/**
 * Componente de card individual de empréstimo.
 * Exibe o resumo de um empréstimo: devedor, parcela, progresso e status.
 * Emite eventos para ações do usuário: ver perfil, registrar pagamento e ver detalhes.
 */
@Component({
    selector: 'app-card-emprestimo',
    templateUrl: './card-emprestimo.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, CurrencyPipe, DatePipe],
})
export class CardEmprestimoComponent {
    /** Empréstimo a ser exibido no card */
    @Input({ required: true }) emprestimo!: Emprestimo;

    /** Emitido ao clicar no nome do devedor (abre o perfil do devedor) */
    @Output() verDevedor = new EventEmitter<string>();

    /** Emitido ao clicar no botão "Registrar Pagamento" */
    @Output() registrarPagamento = new EventEmitter<Emprestimo>();

    /** Emitido ao clicar no card (abre os detalhes do empréstimo) */
    @Output() verDetalhes = new EventEmitter<Emprestimo>();

    constructor(public calc: CalculadoraEmprestimoService) { }
}
