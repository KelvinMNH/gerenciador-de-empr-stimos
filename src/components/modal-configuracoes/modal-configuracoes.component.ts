import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

/**
 * Componente de modal de configurações e gerenciamento de dados.
 * Oferece ao usuário funcionalidades de exportar backup, importar dados e limpar tudo.
 */
@Component({
    selector: 'app-modal-configuracoes',
    templateUrl: './modal-configuracoes.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, DatePipe],
})
export class ModalConfiguracoesComponent {
    /** Timestamp do último backup exportado (null se nunca foi feito backup) */
    @Input() timestampUltimoBackup: number | null = null;

    /** Emitido ao clicar em "Exportar Backup" */
    @Output() exportarDados = new EventEmitter<void>();

    /** Emitido ao selecionar um arquivo para importar (passa o evento nativo) */
    @Output() importarDados = new EventEmitter<Event>();

    /** Emitido ao clicar em "Limpar Todos os Dados" */
    @Output() limparDados = new EventEmitter<void>();

    /** Emitido ao fechar o modal */
    @Output() fechar = new EventEmitter<void>();
}
