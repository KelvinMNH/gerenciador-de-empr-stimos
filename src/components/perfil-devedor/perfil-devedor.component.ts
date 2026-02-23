import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Emprestimo } from '../../models/emprestimo.model';
import { CalculadoraEmprestimoService } from '../../services/calculadora-emprestimo.service';
import { NivelDevedor } from '../../services/devedor.service';

/**
 * Componente de perfil completo de um devedor.
 * Exibe o dashboard de resumo financeiro, classificação (nível), notas e histórico de empréstimos.
 */
@Component({
    selector: 'app-perfil-devedor',
    templateUrl: './perfil-devedor.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, CurrencyPipe, DatePipe, ReactiveFormsModule],
})
export class PerfilDevedorComponent {
    /** Nome do devedor exibido no perfil */
    @Input({ required: true }) nomeDevedor!: string;

    /** Lista de empréstimos deste devedor (já filtrada pelo componente raiz) */
    @Input({ required: true }) emprestimos!: Emprestimo[];

    /** Classificação de risco/confiança do devedor */
    @Input() nivel: NivelDevedor | null = null;

    /** Nota/observação salva sobre o devedor */
    @Input() observacao: string = '';

    /** Emitido ao clicar em "Voltar para o Dashboard" */
    @Output() voltar = new EventEmitter<void>();

    /** Emitido ao clicar em um empréstimo da lista (abre detalhes) */
    @Output() verEmprestimo = new EventEmitter<Emprestimo>();

    /** Emitido ao clicar em "Registrar Pagamento" em um empréstimo */
    @Output() registrarPagamento = new EventEmitter<Emprestimo>();

    /** Emitido ao salvar a observação do devedor (passa o novo texto) */
    @Output() salvarObservacao = new EventEmitter<string>();

    /** Controla se a área de observações está em modo de edição */
    editandoObservacao = signal(false);

    /** Controle de formulário para edição da observação */
    controleObservacao = new FormControl('');

    constructor(public calc: CalculadoraEmprestimoService) { }

    // --- Totais calculados localmente com base na lista de empréstimos do devedor ---

    /** Soma o total que o devedor tomou emprestado */
    get totalEmprestado(): number {
        return this.emprestimos.reduce((s, e) => s + e.principal, 0);
    }

    /** Soma o total pago pelo devedor */
    get totalPago(): number {
        return this.emprestimos.reduce((s, e) => s + this.calc.calcularTotalPago(e), 0);
    }

    /** Saldo devedor atual */
    get dividaAtual(): number {
        return this.emprestimos.reduce((s, e) => s + this.calc.calcularSaldoDevedor(e), 0);
    }

    /** Número de empréstimos ativos (não quitados) */
    get quantidadeAtivos(): number {
        return this.emprestimos.filter(e => !this.calc.estaQuitado(e)).length;
    }

    /** Número de empréstimos já quitados */
    get quantidadeQuitados(): number {
        return this.emprestimos.filter(e => this.calc.estaQuitado(e)).length;
    }

    /** Inicia a edição da observação, pré-preenchendo com o valor atual */
    iniciarEdicao(): void {
        this.controleObservacao.setValue(this.observacao);
        this.editandoObservacao.set(true);
    }

    /** Confirma a edição e emite a observação atualizada para o componente raiz */
    confirmarSalvar(): void {
        this.salvarObservacao.emit(this.controleObservacao.value ?? '');
        this.editandoObservacao.set(false);
    }

    /** Cancela a edição sem salvar alterações */
    cancelarEdicao(): void {
        this.editandoObservacao.set(false);
    }
}
