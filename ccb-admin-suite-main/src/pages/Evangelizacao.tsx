import { useState } from 'react';
import { Plus, Trash2, Edit, Users, Calendar, CheckCircle2, Clock, XCircle, Heart } from 'lucide-react';
import { useMembrosEvangelizacao, useAtendimentosEvangelizacao, useReunioesEvangelizacao } from '@/hooks/useData';
import { MembroEvangelizacao, AtendimentoEvangelizacao, ReuniaoEvangelizacao, FuncaoEvangelizacao, StatusAtendimento } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const funcoes: FuncaoEvangelizacao[] = ['Responsável', 'Auxiliar', 'Cooperador', 'Visitante'];

const funcaoCor: Record<FuncaoEvangelizacao, string> = {
  'Responsável': 'bg-primary/10 text-primary border-primary/20',
  'Auxiliar': 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-300/40',
  'Cooperador': 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-300/40',
  'Visitante': 'bg-muted text-muted-foreground border-border',
};

const statusCor: Record<StatusAtendimento, string> = {
  'Agendado': 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-300/40',
  'Realizado': 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-300/40',
  'Cancelado': 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-300/40',
};

const StatusIcon = ({ status }: { status: StatusAtendimento }) => {
  if (status === 'Realizado') return <CheckCircle2 className="h-3.5 w-3.5" />;
  if (status === 'Cancelado') return <XCircle className="h-3.5 w-3.5" />;
  return <Clock className="h-3.5 w-3.5" />;
};

export default function Evangelizacao() {
  const { membros, adicionar: adicionarMembro, remover: removerMembro, atualizar: atualizarMembro } = useMembrosEvangelizacao();
  const { atendimentos, adicionar: adicionarAtend, remover: removerAtend, atualizar: atualizarAtend } = useAtendimentosEvangelizacao();
  const { reunioes, adicionar: adicionarReuniao, remover: removerReuniao, atualizar: atualizarReuniao } = useReunioesEvangelizacao();

  const [aba, setAba] = useState<'membros' | 'atendimentos' | 'reunioes'>('membros');

  // ── Estados de filtro ────────────────────────────────────────────────────
  const [filtroFuncao, setFiltroFuncao] = useState('Todos');
  const [filtroStatus, setFiltroStatus] = useState<StatusAtendimento | 'Todos'>('Todos');

  // ── Modals ───────────────────────────────────────────────────────────────
  const [membroModalOpen, setMembroModalOpen] = useState(false);
  const [atendModalOpen, setAtendModalOpen] = useState(false);
  const [reuniaoModalOpen, setReuniaoModalOpen] = useState(false);

  const [editingMembroId, setEditingMembroId] = useState<string | null>(null);
  const [editingAtendId, setEditingAtendId] = useState<string | null>(null);
  const [editingReuniaoId, setEditingReuniaoId] = useState<string | null>(null);

  // ── Forms ────────────────────────────────────────────────────────────────
  const [formMembro, setFormMembro] = useState({ nome: '', funcao: 'Auxiliar' as FuncaoEvangelizacao, telefone: '', ativo: true });
  const [formAtend, setFormAtend] = useState({ data: '', horario: '', local: '', responsavelNome: '', interessadoNome: '', observacoes: '', status: 'Agendado' as StatusAtendimento });
  const [formReuniao, setFormReuniao] = useState({ data: '', horario: '', local: '', descricao: '', participantes: [] as string[], observacoes: '' });

  const resetFormMembro = () => setFormMembro({ nome: '', funcao: 'Auxiliar', telefone: '', ativo: true });
  const resetFormAtend = () => setFormAtend({ data: '', horario: '', local: '', responsavelNome: '', interessadoNome: '', observacoes: '', status: 'Agendado' });
  const resetFormReuniao = () => setFormReuniao({ data: '', horario: '', local: '', descricao: '', participantes: [], observacoes: '' });

  // ── Handlers Membros ──────────────────────────────────────────────────────
  const handleSalvarMembro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMembro.nome) return;
    if (editingMembroId) {
      await atualizarMembro(editingMembroId, formMembro);
    } else {
      await adicionarMembro(formMembro);
    }
    resetFormMembro();
    setEditingMembroId(null);
    setMembroModalOpen(false);
  };

  const handleEditarMembro = (m: MembroEvangelizacao) => {
    setFormMembro({ nome: m.nome, funcao: m.funcao, telefone: m.telefone || '', ativo: m.ativo });
    setEditingMembroId(m.id);
    setMembroModalOpen(true);
  };

  // ── Handlers Atendimentos ─────────────────────────────────────────────────
  const handleSalvarAtend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAtend.data || !formAtend.interessadoNome) return;
    if (editingAtendId) {
      await atualizarAtend(editingAtendId, formAtend);
    } else {
      await adicionarAtend(formAtend);
    }
    resetFormAtend();
    setEditingAtendId(null);
    setAtendModalOpen(false);
  };

  const handleEditarAtend = (a: AtendimentoEvangelizacao) => {
    setFormAtend({ data: a.data, horario: a.horario || '', local: a.local || '', responsavelNome: a.responsavelNome, interessadoNome: a.interessadoNome, observacoes: a.observacoes || '', status: a.status });
    setEditingAtendId(a.id);
    setAtendModalOpen(true);
  };

  // ── Handlers Reuniões ────────────────────────────────────────────────────
  const handleSalvarReuniao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formReuniao.data) return;
    if (editingReuniaoId) {
      await atualizarReuniao(editingReuniaoId, formReuniao);
    } else {
      await adicionarReuniao(formReuniao);
    }
    resetFormReuniao();
    setEditingReuniaoId(null);
    setReuniaoModalOpen(false);
  };

  const handleEditarReuniao = (r: ReuniaoEvangelizacao) => {
    setFormReuniao({ data: r.data, horario: r.horario || '', local: r.local || '', descricao: r.descricao || '', participantes: r.participantes || [], observacoes: r.observacoes || '' });
    setEditingReuniaoId(r.id);
    setReuniaoModalOpen(true);
  };

  const toggleParticipante = (id: string) => {
    setFormReuniao(prev => ({
      ...prev,
      participantes: prev.participantes.includes(id)
        ? prev.participantes.filter(p => p !== id)
        : [...prev.participantes, id],
    }));
  };

  // ── Dados filtrados ───────────────────────────────────────────────────────
  const membrosAtivos = [...membros].filter(m => filtroFuncao === 'Todos' || m.funcao === filtroFuncao).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  const atendFiltrados = [...atendimentos]
    .filter(a => filtroStatus === 'Todos' || a.status === filtroStatus)
    .sort((a, b) => b.data.localeCompare(a.data));

  const reunioesOrdenadas = [...reunioes].sort((a, b) => b.data.localeCompare(a.data));

  const getMembroNome = (id: string) => membros.find(m => m.id === id)?.nome || id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Evangelização</h1>
          <p className="text-sm text-muted-foreground mt-1">Setor de evangelização — membros, atendimentos e reuniões</p>
        </div>
        <div>
          {aba === 'membros' && (
            <Button className="gap-2" onClick={() => { resetFormMembro(); setEditingMembroId(null); setMembroModalOpen(true); }}>
              <Plus className="h-4 w-4" /> Novo Membro
            </Button>
          )}
          {aba === 'atendimentos' && (
            <Button className="gap-2" onClick={() => { resetFormAtend(); setEditingAtendId(null); setAtendModalOpen(true); }}>
              <Plus className="h-4 w-4" /> Novo Atendimento
            </Button>
          )}
          {aba === 'reunioes' && (
            <Button className="gap-2" onClick={() => { resetFormReuniao(); setEditingReuniaoId(null); setReuniaoModalOpen(true); }}>
              <Plus className="h-4 w-4" /> Nova Reunião
            </Button>
          )}
        </div>
      </div>

      {/* Sub-abas */}
      <div className="flex gap-2 border-b border-border">
        {([
          { key: 'membros', label: 'Membros do Setor', icon: Users },
          { key: 'atendimentos', label: 'Atendimentos', icon: Calendar },
          { key: 'reunioes', label: 'Reuniões', icon: Heart },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setAba(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              aba === key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── ABA: MEMBROS ────────────────────────────────────────────────────── */}
      {aba === 'membros' && (
        <div className="space-y-4">
          {/* Filtros */}
          <div className="flex gap-2 flex-wrap">
            {(['Todos', ...funcoes] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFiltroFuncao(f)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filtroFuncao === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {membrosAtivos.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <Users className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-4 text-muted-foreground">Nenhum membro cadastrado.</p>
            </div>
          ) : (
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Função</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Telefone</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {membrosAtivos.map((m) => (
                      <tr key={m.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{m.nome}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={funcaoCor[m.funcao]}>{m.funcao}</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{m.telefone || '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleEditarMembro(m)} className="text-muted-foreground hover:text-primary transition-colors p-1">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button onClick={() => removerMembro(m.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ABA: ATENDIMENTOS ──────────────────────────────────────────────── */}
      {aba === 'atendimentos' && (
        <div className="space-y-4">
          {/* Filtros */}
          <div className="flex gap-2 flex-wrap">
            {(['Todos', 'Agendado', 'Realizado', 'Cancelado'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFiltroStatus(s)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filtroStatus === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {atendFiltrados.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <Calendar className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-4 text-muted-foreground">Nenhum atendimento registrado.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {atendFiltrados.map((a) => (
                <div key={a.id} className="glass-card rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">{a.interessadoNome}</span>
                        <Badge variant="outline" className={`flex items-center gap-1 text-xs ${statusCor[a.status]}`}>
                          <StatusIcon status={a.status} />
                          {a.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        📅 {new Date(a.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                        {a.horario && ` às ${a.horario}`}
                        {a.local && ` · 📍 ${a.local}`}
                      </p>
                      {a.responsavelNome && <p className="text-sm text-muted-foreground">👤 Responsável: {a.responsavelNome}</p>}
                      {a.observacoes && <p className="text-xs text-muted-foreground mt-1">{a.observacoes}</p>}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => handleEditarAtend(a)} className="text-muted-foreground hover:text-primary transition-colors p-1">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => removerAtend(a.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ABA: REUNIÕES ─────────────────────────────────────────────────── */}
      {aba === 'reunioes' && (
        <div className="space-y-4">
          {reunioesOrdenadas.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <Heart className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-4 text-muted-foreground">Nenhuma reunião registrada.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reunioesOrdenadas.map((r) => (
                <div key={r.id} className="glass-card rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <p className="font-semibold text-foreground">
                        📅 {new Date(r.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                        {r.horario && ` às ${r.horario}`}
                      </p>
                      {r.local && <p className="text-sm text-muted-foreground">📍 {r.local}</p>}
                      {r.descricao && <p className="text-sm text-muted-foreground">{r.descricao}</p>}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => handleEditarReuniao(r)} className="text-muted-foreground hover:text-primary transition-colors p-1">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => removerReuniao(r.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Participantes */}
                  {r.participantes && r.participantes.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">Participaram ({r.participantes.length}):</p>
                      <div className="flex flex-wrap gap-1.5">
                        {r.participantes.map((pid) => (
                          <Badge key={pid} variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
                            {getMembroNome(pid)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {r.observacoes && <p className="text-xs text-muted-foreground">{r.observacoes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: MEMBRO ─────────────────────────────────────────────────── */}
      <Dialog open={membroModalOpen} onOpenChange={(open) => { setMembroModalOpen(open); if (!open) { resetFormMembro(); setEditingMembroId(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">{editingMembroId ? 'Editar Membro' : 'Novo Membro do Setor'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSalvarMembro} className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={formMembro.nome} onChange={(e) => setFormMembro({ ...formMembro, nome: e.target.value })} placeholder="Nome completo" />
            </div>
            <div>
              <Label>Função</Label>
              <Select value={formMembro.funcao} onValueChange={(v) => setFormMembro({ ...formMembro, funcao: v as FuncaoEvangelizacao })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {funcoes.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Telefone (opcional)</Label>
              <Input value={formMembro.telefone} onChange={(e) => setFormMembro({ ...formMembro, telefone: e.target.value })} placeholder="(34) 99999-9999" />
            </div>
            <div className="flex justify-end">
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: ATENDIMENTO ──────────────────────────────────────────────── */}
      <Dialog open={atendModalOpen} onOpenChange={(open) => { setAtendModalOpen(open); if (!open) { resetFormAtend(); setEditingAtendId(null); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{editingAtendId ? 'Editar Atendimento' : 'Novo Atendimento'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSalvarAtend} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data</Label>
                <Input type="date" value={formAtend.data} onChange={(e) => setFormAtend({ ...formAtend, data: e.target.value })} />
              </div>
              <div>
                <Label>Horário (opcional)</Label>
                <Input type="time" value={formAtend.horario} onChange={(e) => setFormAtend({ ...formAtend, horario: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Nome do Interessado</Label>
              <Input value={formAtend.interessadoNome} onChange={(e) => setFormAtend({ ...formAtend, interessadoNome: e.target.value })} placeholder="Nome da pessoa a ser atendida" />
            </div>
            <div>
              <Label>Responsável pelo Atendimento</Label>
              <Select value={formAtend.responsavelNome || 'manual'} onValueChange={(v) => setFormAtend({ ...formAtend, responsavelNome: v === 'manual' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="Selecione um membro" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Digitar nome manualmente</SelectItem>
                  {[...membros].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map(m => (
                    <SelectItem key={m.id} value={m.nome}>{m.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(!formAtend.responsavelNome || formAtend.responsavelNome === '') && (
                <Input className="mt-2" value={formAtend.responsavelNome} onChange={(e) => setFormAtend({ ...formAtend, responsavelNome: e.target.value })} placeholder="Nome do responsável" />
              )}
            </div>
            <div>
              <Label>Local (opcional)</Label>
              <Input value={formAtend.local} onChange={(e) => setFormAtend({ ...formAtend, local: e.target.value })} placeholder="Endereço ou local" />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formAtend.status} onValueChange={(v) => setFormAtend({ ...formAtend, status: v as StatusAtendimento })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Agendado">Agendado</SelectItem>
                  <SelectItem value="Realizado">Realizado</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observações (opcional)</Label>
              <Input value={formAtend.observacoes} onChange={(e) => setFormAtend({ ...formAtend, observacoes: e.target.value })} placeholder="Anotações sobre o atendimento" />
            </div>
            <div className="flex justify-end">
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: REUNIÃO ──────────────────────────────────────────────────── */}
      <Dialog open={reuniaoModalOpen} onOpenChange={(open) => { setReuniaoModalOpen(open); if (!open) { resetFormReuniao(); setEditingReuniaoId(null); } }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editingReuniaoId ? 'Editar Reunião' : 'Nova Reunião de Evangelização'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSalvarReuniao} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data</Label>
                <Input type="date" value={formReuniao.data} onChange={(e) => setFormReuniao({ ...formReuniao, data: e.target.value })} />
              </div>
              <div>
                <Label>Horário (opcional)</Label>
                <Input type="time" value={formReuniao.horario} onChange={(e) => setFormReuniao({ ...formReuniao, horario: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Local (opcional)</Label>
              <Input value={formReuniao.local} onChange={(e) => setFormReuniao({ ...formReuniao, local: e.target.value })} placeholder="Endereço ou local da reunião" />
            </div>
            <div>
              <Label>Descrição (opcional)</Label>
              <Input value={formReuniao.descricao} onChange={(e) => setFormReuniao({ ...formReuniao, descricao: e.target.value })} placeholder="Tema ou pauta da reunião" />
            </div>

            {/* Lista de participantes */}
            {membros.length > 0 && (
              <div>
                <Label>Participantes</Label>
                <div className="mt-2 border border-border rounded-lg divide-y divide-border max-h-48 overflow-y-auto">
                  {[...membros].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map((m) => (
                    <label key={m.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/30 transition-colors">
                      <Checkbox
                        checked={formReuniao.participantes.includes(m.id)}
                        onCheckedChange={() => toggleParticipante(m.id)}
                      />
                      <span className="text-sm text-foreground">{m.nome}</span>
                      <Badge variant="outline" className={`ml-auto text-xs ${funcaoCor[m.funcao]}`}>{m.funcao}</Badge>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{formReuniao.participantes.length} selecionado(s)</p>
              </div>
            )}

            <div>
              <Label>Observações (opcional)</Label>
              <Input value={formReuniao.observacoes} onChange={(e) => setFormReuniao({ ...formReuniao, observacoes: e.target.value })} placeholder="Anotações sobre a reunião" />
            </div>
            <div className="flex justify-end">
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
