
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';

// === Modelos ===
import { DadosApp, Emprestimo, Pagamento, ProximaCobranca } from './models/emprestimo.model';

// === Serviços ===
import { ArmazenamentoService } from './services/armazenamento.service';
import { CalculadoraEmprestimoService } from './services/calculadora-emprestimo.service';
import { DevedorService } from './services/devedor.service';

// === Componentes ===
import { CardEmprestimoComponent } from './components/card-emprestimo/card-emprestimo.component';
import { PerfilDevedorComponent } from './components/perfil-devedor/perfil-devedor.component';
import { DetalheEmprestimoComponent } from './components/detalhe-emprestimo/detalhe-emprestimo.component';
import { ProximasCobrancasComponent } from './components/proximas-cobrancas/proximas-cobrancas.component';
import { ModalAdicionarEmprestimoComponent } from './components/modal-adicionar-emprestimo/modal-adicionar-emprestimo.component';
import { ModalRegistrarPagamentoComponent } from './components/modal-registrar-pagamento/modal-registrar-pagamento.component';
import { ModalConfiguracoesComponent } from './components/modal-configuracoes/modal-configuracoes.component';

/**
 * Componente raiz da aplicação — Gerenciador de Empréstimos.
 *
 * Responsabilidade: orquestrar o estado global e a comunicação entre componentes.
 * A lógica financeira fica na CalculadoraEmprestimoService, de devedor na DevedorService,
 * e de persistência na ArmazenamentoService.
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    // Componentes filhos
    CardEmprestimoComponent,
    PerfilDevedorComponent,
    DetalheEmprestimoComponent,
    ProximasCobrancasComponent,
    ModalAdicionarEmprestimoComponent,
    ModalRegistrarPagamentoComponent,
    ModalConfiguracoesComponent,
  ],
  providers: [ArmazenamentoService],
})
export class AppComponent {
  // === Injeção de dependências ===
  private armazenamento = inject(ArmazenamentoService);
  private calculadora = inject(CalculadoraEmprestimoService);
  private devedorService = inject(DevedorService);

  // === Estado de dados (persistido via efeito reativo) ===
  emprestimos = signal<Emprestimo[]>([]);
  observacoesDevedores = signal<Record<string, string>>({});
  timestampUltimoBackup = signal<number | null>(null);

  // === Estado de UI ===
  adicionandoEmprestimo = signal(false);
  /** Empréstimo selecionado para registro de pagamento */
  emprestimoParaPagamento = signal<Emprestimo | null>(null);
  /** Aba ativa no dashboard: 'todos' | 'atrasados' | 'proximos' */
  modoVisualizacao = signal<'todos' | 'atrasados' | 'proximos'>('todos');
  /** Devedor selecionado para ver o perfil */
  devedorSelecionado = signal<string | null>(null);
  /** Empréstimo selecionado para ver o detalhe dentro do perfil do devedor */
  emprestimoSelecionado = signal<Emprestimo | null>(null);
  configuracoesAbertas = signal(false);
  exibirAvisoDados = signal(false);
  naoExibirNovamente = signal(false);

  constructor() {
    // Carrega dados do armazenamento ao iniciar
    this.carregarDados();

    // Exibe aviso na primeira visita do usuário
    const jaViu = localStorage.getItem('loan-manager-warning-seen');
    if (!jaViu) {
      this.exibirAvisoDados.set(true);
    }

    // Efeito reativo: persiste automaticamente qualquer mudança de estado
    effect(() => {
      const dados: DadosApp = {
        loans: this.emprestimos(),
        borrowerNotes: this.observacoesDevedores(),
      };
      this.armazenamento.salvarDados(dados);
    });
  }

  /**
   * Intercepta o evento de fechar/recarregar a aba do navegador.
   * Exibe diálogo nativo para evitar perda de dados não exportados.
   */
  @HostListener('window:beforeunload', ['$event'])
  aoTentarFechar($event: any): void {
    $event.returnValue = true;
  }

  // ============================================================
  // === Computed: totais globais do dashboard ==================
  // ============================================================

  /** Soma o valor principal de todos os empréstimos */
  totalEmprestado = computed(() => this.emprestimos().reduce((s, e) => s + e.principal, 0));

  /** Soma o total já pago em todos os empréstimos */
  totalPago = computed(() => this.emprestimos().reduce((s, e) => s + this.calculadora.calcularTotalPago(e), 0));

  /** Soma o saldo devedor de todos os empréstimos */
  totalAReceber = computed(() => this.emprestimos().reduce((s, e) => s + this.calculadora.calcularSaldoDevedor(e), 0));

  /**
   * Retorna a lista de empréstimos filtrada pela aba ativa.
   * - 'todos': todos os empréstimos
   * - 'atrasados': apenas os com atraso
   */
  emprestimosExibidos = computed(() => {
    if (this.modoVisualizacao() === 'atrasados') {
      return this.emprestimos().filter(e => this.calculadora.estaAtrasado(e));
    }
    return this.emprestimos();
  });

  /**
   * Calcula a lista de próximas cobranças para todos os empréstimos ativos.
   * Ordenada por data de vencimento mais próxima.
   */
  proximasCobrancas = computed((): ProximaCobranca[] => {
    const hoje = new Date();
    hoje.setUTCHours(0, 0, 0, 0);

    const cobrancas: ProximaCobranca[] = [];

    for (const emprestimo of this.emprestimos()) {
      if (this.calculadora.estaQuitado(emprestimo)) continue;

      const proximoVencimento = this.calculadora.calcularProximoVencimento(emprestimo);
      if (proximoVencimento && proximoVencimento >= hoje) {
        const diferenca = proximoVencimento.getTime() - hoje.getTime();
        const diasRestantes = Math.ceil(diferenca / (1000 * 3600 * 24));
        cobrancas.push({
          loanId: emprestimo.id,
          borrowerName: emprestimo.borrowerName,
          dueDate: proximoVencimento,
          amount: this.calculadora.calcularParcelaMensal(emprestimo),
          paymentNumber: this.calculadora.calcularParcelasPagas(emprestimo) + 1,
          totalPayments: emprestimo.paymentTermInMonths,
          daysRemaining: diasRestantes,
        });
      }
    }

    return cobrancas.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  });

  // ============================================================
  // === Computed: dados do devedor selecionado =================
  // ============================================================

  /** Empréstimos do devedor selecionado, ordenados por data decrescente */
  emprestimosDoDevedor = computed(() =>
    this.emprestimos()
      .filter(e => e.borrowerName === this.devedorSelecionado())
      .sort((a, b) => new Date(b.dateLent).getTime() - new Date(a.dateLent).getTime())
  );

  /** Classificação de nível do devedor selecionado */
  nivelDevedorSelecionado = computed(() => {
    const nome = this.devedorSelecionado();
    if (!nome) return null;
    return this.devedorService.classificarDevedor(nome, this.emprestimos());
  });

  /** Observação salva para o devedor selecionado */
  observacaoDevedorSelecionado = computed(() => {
    const nome = this.devedorSelecionado();
    if (!nome) return '';
    return this.observacoesDevedores()[nome] || '';
  });

  // ============================================================
  // === Ações: empréstimos =====================================
  // ============================================================

  /**
   * Recebe um novo empréstimo do modal e adiciona à lista,
   * mantendo a ordenação por data de empréstimo crescente.
   * @param dados Dados do formulário sem ID e sem pagamentos
   */
  handleSalvarEmprestimo(dados: Omit<Emprestimo, 'id' | 'payments'>): void {
    const novoEmprestimo: Emprestimo = { ...dados, id: Date.now(), payments: [] };
    this.emprestimos.update(lista =>
      [...lista, novoEmprestimo].sort((a, b) => new Date(a.dateLent).getTime() - new Date(b.dateLent).getTime())
    );
    this.adicionandoEmprestimo.set(false);
  }

  /**
   * Abre o modal de registrar pagamento para o empréstimo informado.
   * @param emprestimo Empréstimo a ser pago
   */
  abrirModalPagamento(emprestimo: Emprestimo): void {
    this.emprestimoParaPagamento.set(emprestimo);
  }

  /**
   * Retorna o valor pré-sugerido para o campo de pagamento,
   * incluindo eventuais multas por atraso.
   */
  getValorSugerido(): number {
    const emprestimo = this.emprestimoParaPagamento();
    if (!emprestimo) return 0;
    return this.calculadora.calcularDetalhesAtraso(emprestimo).totalDevido;
  }

  /**
   * Recebe um pagamento do modal e registra no empréstimo correspondente.
   * @param pagamento Objeto Pagamento com valor e data
   */
  handleSalvarPagamento(pagamento: Pagamento): void {
    const emprestimoAtual = this.emprestimoParaPagamento();
    if (!emprestimoAtual) return;
    this.emprestimos.update(lista =>
      lista.map(e =>
        e.id === emprestimoAtual.id ? { ...e, payments: [...e.payments, pagamento] } : e
      )
    );
    this.emprestimoParaPagamento.set(null);
  }

  // ============================================================
  // === Ações: navegação de views ==============================
  // ============================================================

  /** Navega para o perfil do devedor */
  verPerfilDevedor(nome: string): void {
    this.devedorSelecionado.set(nome);
  }

  /** Volta ao dashboard principal */
  fecharPerfil(): void {
    this.devedorSelecionado.set(null);
    this.emprestimoSelecionado.set(null);
  }

  /** Navega para o detalhe de um empréstimo específico */
  verDetalheEmprestimo(emprestimo: Emprestimo): void {
    this.devedorSelecionado.set(emprestimo.borrowerName);
    this.emprestimoSelecionado.set(emprestimo);
  }

  /** Volta para o perfil do devedor a partir dos detalhes */
  fecharDetalhe(): void {
    this.emprestimoSelecionado.set(null);
  }

  // ============================================================
  // === Ações: observações do devedor ==========================
  // ============================================================

  /**
   * Salva a observação atualizada para o devedor selecionado.
   * @param novaObservacao Conteúdo atualizado
   */
  handleSalvarObservacao(novaObservacao: string): void {
    const devedor = this.devedorSelecionado();
    if (!devedor) return;
    this.observacoesDevedores.update(obs => ({ ...obs, [devedor]: novaObservacao }));
  }

  // ============================================================
  // === Ações: aviso de dados ==================================
  // ============================================================

  /** Fecha o banner de aviso; salva preferência se marcado */
  fecharAviso(): void {
    if (this.naoExibirNovamente()) {
      localStorage.setItem('loan-manager-warning-seen', 'true');
    }
    this.exibirAvisoDados.set(false);
  }

  // ============================================================
  // === Ações: backup e importação =============================
  // ============================================================

  /**
   * Exporta todos os dados como arquivo JSON para download.
   * Registra o timestamp para exibição no modal de configurações.
   */
  exportarDados(): void {
    const dados: DadosApp = { loans: this.emprestimos(), borrowerNotes: this.observacoesDevedores() };
    const conteudo = JSON.stringify(dados, null, 2);
    const blob = new Blob([conteudo], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dados-emprestimos.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    const ts = Date.now();
    this.timestampUltimoBackup.set(ts);
    this.armazenamento.salvarTimestampExportacao(ts);
  }

  /**
   * Importa dados a partir de um arquivo JSON selecionado pelo usuário.
   * Substitui todos os dados atuais após confirmação.
   * @param evento Evento nativo do input[type=file]
   */
  importarDados(evento: Event): void {
    if (!confirm('Importar um novo arquivo substituirá todos os dados atuais salvos neste navegador. Deseja continuar?')) {
      (evento.target as HTMLInputElement).value = '';
      return;
    }
    const input = evento.target as HTMLInputElement;
    if (!input.files?.length) return;
    const arquivo = input.files[0];
    const leitor = new FileReader();

    leitor.onload = () => {
      try {
        const dados: DadosApp = JSON.parse(leitor.result as string);
        if (dados && Array.isArray(dados.loans) && typeof dados.borrowerNotes === 'object') {
          this.emprestimos.set(dados.loans);
          this.observacoesDevedores.set(dados.borrowerNotes);
          const ts = Date.now();
          this.timestampUltimoBackup.set(ts);
          this.armazenamento.salvarTimestampExportacao(ts);
          this.configuracoesAbertas.set(false);
        } else {
          alert('Arquivo inválido ou corrompido.');
        }
      } catch (e) {
        console.error('Erro ao carregar o arquivo:', e);
        alert('Erro ao processar o arquivo. Verifique se o formato é JSON válido.');
      } finally {
        input.value = '';
      }
    };

    leitor.onerror = () => {
      console.error('Erro ao ler o arquivo.');
      alert('Não foi possível ler o arquivo selecionado.');
      input.value = '';
    };

    leitor.readAsText(arquivo);
  }

  /**
   * Apaga TODOS os dados após confirmação do usuário.
   * Ação irreversível — limpa o armazenamento e zera os signals.
   */
  limparTodosDados(): void {
    if (confirm('ATENÇÃO: Esta ação é irreversível e apagará TODOS os dados de empréstimos e notas salvos NESTE NAVEGADOR. Deseja continuar?')) {
      this.emprestimos.set([]);
      this.observacoesDevedores.set({});
      this.timestampUltimoBackup.set(null);
      this.armazenamento.limparTudo();
      this.configuracoesAbertas.set(false);
    }
  }

  // ============================================================
  // === Helpers privados ======================================
  // ============================================================

  /**
   * Carrega os dados salvos no armazenamento e popula os signals.
   * Chamado apenas uma vez, no constructor.
   */
  private carregarDados(): void {
    const dados = this.armazenamento.carregarDados();
    if (dados) {
      this.emprestimos.set(dados.loans);
      this.observacoesDevedores.set(dados.borrowerNotes);
    }
    this.timestampUltimoBackup.set(this.armazenamento.carregarTimestampExportacao());
  }
}
