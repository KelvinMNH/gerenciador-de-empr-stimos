import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Emprestimo, Pagamento } from '../../models/emprestimo.model';

/**
 * Componente de modal para registro de um pagamento de parcela.
 * Pré-preenche o valor com o total devido (incluindo multa por atraso, se houver).
 */
@Component({
    selector: 'app-modal-registrar-pagamento',
    templateUrl: './modal-registrar-pagamento.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, ReactiveFormsModule, CurrencyPipe],
})
export class ModalRegistrarPagamentoComponent implements OnInit {
    /** Empréstimo ao qual o pagamento será registrado */
    @Input({ required: true }) emprestimo!: Emprestimo;

    /**
     * Valor pré-preenchido no campo de valor.
     * Deve ser o totalDevido calculado (inclui multa se atrasado).
     */
    @Input() valorSugerido: number = 0;

    /** Emitido com o objeto Pagamento ao confirmar o registro */
    @Output() salvar = new EventEmitter<Pagamento>();

    /** Emitido ao clicar em "Cancelar" */
    @Output() cancelar = new EventEmitter<void>();

    /** Formulário reativo para o registro de pagamento */
    formulario = this.fb.group({
        amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
        date: [new Date().toISOString().split('T')[0], Validators.required],
    });

    constructor(private fb: FormBuilder) { }

    /**
     * Aplica o valorSugerido ao campo do formulário assim que o modal é aberto.
     * Necessário porque @Input() chega antes do ngOnInit, mas o formulário
     * só pode ser preenchido após a inicialização do componente.
     */
    ngOnInit(): void {
        if (this.valorSugerido > 0) {
            this.formulario.patchValue({ amount: parseFloat(this.valorSugerido.toFixed(2)) });
        }
    }

    /**
     * Valida e emite o pagamento ao confirmar.
     */
    aoEnviar(): void {
        if (this.formulario.invalid) return;
        this.salvar.emit({
            amount: this.formulario.value.amount!,
            date: this.formulario.value.date!,
        });
    }
}
