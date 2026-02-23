import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Emprestimo } from '../../models/emprestimo.model';
import { CalculadoraEmprestimoService } from '../../services/calculadora-emprestimo.service';

/**
 * Componente de view de detalhes de um empréstimo específico.
 * Mostra os valores principais, progresso das parcelas e histórico de pagamentos.
 */
@Component({
    selector: 'app-detalhe-emprestimo',
    templateUrl: './detalhe-emprestimo.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, CurrencyPipe, DatePipe],
})
export class DetalheEmprestimoComponent {
    /** Empréstimo cujos detalhes serão exibidos */
    @Input({ required: true }) emprestimo!: Emprestimo;

    /** Nome do devedor (exibido no botão de voltar) */
    @Input({ required: true }) nomeDevedor!: string;

    /** Emitido ao clicar em "Voltar para o Perfil" */
    @Output() voltar = new EventEmitter<void>();

    constructor(public calc: CalculadoraEmprestimoService) { }
}
