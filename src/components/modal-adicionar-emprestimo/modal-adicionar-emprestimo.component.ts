import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Emprestimo } from '../../models/emprestimo.model';

/**
 * Componente de modal para cadastro de um novo empréstimo.
 * Contém o formulário reativo com validação, incluindo a seleção do tipo de juros.
 */
@Component({
    selector: 'app-modal-adicionar-emprestimo',
    templateUrl: './modal-adicionar-emprestimo.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, ReactiveFormsModule],
})
export class ModalAdicionarEmprestimoComponent {
    /** Emitido com os dados do empréstimo ao confirmar o formulário */
    @Output() salvar = new EventEmitter<Omit<Emprestimo, 'id' | 'payments'>>();

    /** Emitido ao clicar em "Cancelar" */
    @Output() cancelar = new EventEmitter<void>();

    /** Formulário reativo para criação de novo empréstimo */
    formulario = this.fb.group({
        borrowerName: ['', Validators.required],
        principal: [null as number | null, [Validators.required, Validators.min(0.01)]],
        interestRate: [null as number | null, [Validators.required, Validators.min(0)]],
        /** Tipo de juros: 'simples' ou 'compostos'. Padrão: compostos (Tabela Price) */
        tipoJuros: ['compostos' as 'simples' | 'compostos'],
        paymentTermInMonths: [null as number | null, [Validators.required, Validators.min(1)]],
        paymentDay: [15 as number | null, [Validators.required, Validators.min(1), Validators.max(30)]],
        dateLent: [new Date().toISOString().split('T')[0], Validators.required],
    });

    constructor(private fb: FormBuilder) { }

    /**
     * Valida e emite os dados do formulário ao salvar.
     * Não emite nada se o formulário estiver inválido.
     */
    aoEnviar(): void {
        if (this.formulario.invalid) return;
        const v = this.formulario.value;
        this.salvar.emit({
            borrowerName: v.borrowerName!,
            principal: v.principal!,
            interestRate: v.interestRate!,
            tipoJuros: v.tipoJuros as 'simples' | 'compostos',
            dateLent: v.dateLent!,
            paymentTermInMonths: v.paymentTermInMonths!,
            paymentDay: v.paymentDay!,
        });
    }
}
