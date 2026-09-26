import { useState } from 'react';
import { 
  Plus, Trash2, Calendar as CalIcon, Eye, Edit,
  Users, Cross, Droplets, Music, Heart, Scroll, 
  Briefcase, Radio, Flame, Zap, Crown
} from 'lucide-react';
import { useEventos, useCongregacoes, useMembros } from '@/hooks/useData';
import { Evento } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

const tiposEvento: Evento['tipo'][] = ['Culto', 'RJM', 'Ensaio', 'Reunião', 'Jovens', 'Outro'];

const tiposReunioes = [
  'Reuniões',
  'Santa-Ceia',
  'AGO',
  'Batismo',
  'Reunião para Mocidade',
  'Busca dos Dons',
  'RJM com Busca dos Dons',
  'Reunião Setorial',
  'Reunião Ministerial',
  'Reunião Extra',
  'Culto para Jovens',
  'Ensaio Regional',
  'Ordenação',
  'Reunião de Jovens Agrupada',
  'Reunião com Jovens Estudantes',
  'Apresentação de Novos Obreiros'
];

// Configuração de aparência para cada tipo de reunião
const tiposReuniaoConfig: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  textColor: string;
  borderColor: string;
  description?: string;
  displayName?: string;
}> = {
  'Reuniões': {
    icon: Users,
    gradient: 'from-blue-500/20 to-blue-600/20',
    textColor: 'text-blue-700 dark:text-blue-400',
    borderColor: 'border-blue-300 dark:border-blue-600',
    description: 'Reunião Geral',
    displayName: 'Reuniões'
  },
  'Santa-Ceia': {
    icon: Droplets,
    gradient: 'from-purple-500/20 to-purple-600/20',
    textColor: 'text-purple-700 dark:text-purple-400',
    borderColor: 'border-purple-300 dark:border-purple-600',
    displayName: 'Santa-Ceia'
  },
  'AGO': {
    icon: Users,
    gradient: 'from-green-600/20 to-emerald-500/20',
    textColor: 'text-green-700 dark:text-green-400',
    borderColor: 'border-green-300 dark:border-green-600',
    description: 'Assembleia Geral Ordinária',
    displayName: 'Assembleia Geral Ordinária'
  },
  'Batismo': {
    icon: Droplets,
    gradient: 'from-cyan-500/20 to-blue-500/20',
    textColor: 'text-cyan-700 dark:text-cyan-400',
    borderColor: 'border-cyan-300 dark:border-cyan-600',
  },
  'Reunião para Mocidade': {
    icon: Zap,
    gradient: 'from-yellow-500/20 to-orange-500/20',
    textColor: 'text-yellow-700 dark:text-yellow-400',
    borderColor: 'border-yellow-300 dark:border-yellow-600',
  },
  'Busca dos Dons': {
    icon: Heart,
    gradient: 'from-red-500/20 to-pink-500/20',
    textColor: 'text-red-700 dark:text-red-400',
    borderColor: 'border-red-300 dark:border-red-600',
  },
  'RJM com Busca dos Dons': {
    icon: Crown,
    gradient: 'from-purple-600/20 to-pink-500/20',
    textColor: 'text-purple-700 dark:text-purple-400',
    borderColor: 'border-purple-300 dark:border-purple-600',
    description: 'RJM com foco em Busca dos Dons'
  },
  'Reunião Setorial': {
    icon: Briefcase,
    gradient: 'from-slate-500/20 to-gray-500/20',
    textColor: 'text-slate-700 dark:text-slate-400',
    borderColor: 'border-slate-300 dark:border-slate-600',
  },
  'Reunião Ministerial': {
    icon: Crown,
    gradient: 'from-amber-500/20 to-orange-500/20',
    textColor: 'text-amber-700 dark:text-amber-400',
    borderColor: 'border-amber-300 dark:border-amber-600',
  },
  'Reunião Extra': {
    icon: Radio,
    gradient: 'from-indigo-500/20 to-blue-500/20',
    textColor: 'text-indigo-700 dark:text-indigo-400',
    borderColor: 'border-indigo-300 dark:border-indigo-600',
  },
  'Culto para Jovens': {
    icon: Flame,
    gradient: 'from-orange-500/20 to-red-500/20',
    textColor: 'text-orange-700 dark:text-orange-400',
    borderColor: 'border-orange-300 dark:border-orange-600',
  },
  'Ensaio Regional': {
    icon: Music,
    gradient: 'from-green-500/20 to-emerald-500/20',
    textColor: 'text-green-700 dark:text-green-400',
    borderColor: 'border-green-300 dark:border-green-600',
  },
  'Ordenação': {
    icon: Cross,
    gradient: 'from-rose-500/20 to-pink-500/20',
    textColor: 'text-rose-700 dark:text-rose-400',
    borderColor: 'border-rose-300 dark:border-rose-600',
  },
  'Reunião de Jovens Agrupada': {
    icon: Users,
    gradient: 'from-violet-500/20 to-purple-500/20',
    textColor: 'text-violet-700 dark:text-violet-400',
    borderColor: 'border-violet-300 dark:border-violet-600',
    displayName: 'Reunião de Jovens Agrupada'
  },
  'Reunião com Jovens Estudantes': {
    icon: Users,
    gradient: 'from-teal-500/20 to-cyan-500/20',
    textColor: 'text-teal-700 dark:text-teal-400',
    borderColor: 'border-teal-300 dark:border-teal-600',
    displayName: 'Reunião com Jovens Estudantes'
  },
  'Apresentação de Novos Obreiros': {
    icon: Scroll,
    gradient: 'from-amber-500/20 to-yellow-500/20',
    textColor: 'text-amber-700 dark:text-amber-400',
    borderColor: 'border-amber-300 dark:border-amber-600',
    displayName: 'Apresentação de Novos Obreiros'
  }
};

const tipoCor: Record<Evento['tipo'], string> = {
  Culto: 'bg-primary/10 text-primary border-primary/20',
  RJM: 'bg-accent/20 text-accent-foreground border-accent/30',
  Ensaio: 'bg-success/10 text-success border-success/20',
  Reunião: 'bg-warning/20 text-warning-foreground border-warning/30',
  Jovens: 'bg-violet/10 text-violet border-violet/20',
  Outro: 'bg-muted text-muted-foreground border-border',
};

// Função para obter nome de exibição do tipo de reunião
const getDisplayName = (tipo: string): string => {
  return tiposReuniaoConfig[tipo]?.displayName || tipo;
};

export default function Agenda() {
  const { eventos, adicionar, remover } = useEventos();
  const { congregacoes } = useCongregacoes();
  const { membros } = useMembros();
  const [open, setOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Evento | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [subtipoReunioes, setSubtipoReunioes] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  
  // Estados para controlar "de outra localidade"
  const [anciaoOutraLocalidade, setAnciaoOutraLocalidade] = useState(false);
  const [encarregadoOutraLocalidade, setEncarregadoOutraLocalidade] = useState(false);
  const [diaconoResponsavelOutra, setDiaconoResponsavelOutra] = useState(false);
  const [diaconoAuxiliarOutra, setDiaconoAuxiliarOutra] = useState(false);
  const [responsavelContagemOutra, setResponsavelContagemOutra] = useState(false);
  
  const [form, setForm] = useState({
    titulo: '',
    data: '',
    horario: '',
    tipo: 'Culto' as Evento['tipo'],
    congregacaoId: '',
    descricao: '',
    anciaoAtende: '',
    anciaoLocalidade: '',
    encarregadoRegional: '',
    encarregadoLocalidade: '',
    diaconoResponsavel: '',
    diaconoAuxiliar: '',
    responsavelContagem: '',
    irmaoAtende: '',
    nomeServo: '',
    ministerioOrdenacao: '',
    anciaoOrdena: '',
    nomeObreiro: '',
    ministerioObreiro: '',
    anciaoApresenta: '',
  });

  const resetForm = () => {
    setForm({
      titulo: '',
      data: '',
      horario: '',
      tipo: 'Culto',
      congregacaoId: '',
      descricao: '',
      anciaoAtende: '',
      anciaoLocalidade: '',
      encarregadoRegional: '',
      encarregadoLocalidade: '',
      diaconoResponsavel: '',
      diaconoAuxiliar: '',
      responsavelContagem: '',
      irmaoAtende: '',
      nomeServo: '',
      ministerioOrdenacao: '',
      anciaoOrdena: '',
      nomeObreiro: '',
      ministerioObreiro: '',
      anciaoApresenta: '',
    });
    setAnciaoOutraLocalidade(false);
    setEncarregadoOutraLocalidade(false);
    setDiaconoResponsavelOutra(false);
    setDiaconoAuxiliarOutra(false);
    setResponsavelContagemOutra(false);
  };

  const getMembroNome = (id: string) => membros.find((m) => m.id === id)?.nome || '';

  const getCongregacaoNome = (id: string) => {
    const congregacao = congregacoes.find((c) => c.id === id);
    if (!congregacao) return '';
    return congregacao.nome.toLowerCase().includes('central') 
      ? `${congregacao.nome} (${congregacao.cidade})`
      : congregacao.nome;
  };

  const abrirComTipoReunioes = (tipoReuniao: string) => {
    resetForm();
    setSubtipoReunioes(tipoReuniao);
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let titulo = form.titulo;
    if (form.tipo === 'Reunião' && subtipoReunioes && !titulo) {
      titulo = subtipoReunioes;
    }
    if (!titulo || !form.data) return;
    
    // Substituir IDs de membros por nomes
    const formToSave = {
      ...form,
      titulo,
      subtipoReuniao: subtipoReunioes,
      anciaoAtende: (subtipoReunioes === 'Batismo' || subtipoReunioes === 'Santa-Ceia')
        ? (form.irmaoAtende || '')
        : (form.anciaoAtende ? getMembroNome(form.anciaoAtende) || form.anciaoAtende : ''),
      encarregadoRegional: form.encarregadoRegional ? getMembroNome(form.encarregadoRegional) || form.encarregadoRegional : '',
      diaconoResponsavel: form.diaconoResponsavel ? getMembroNome(form.diaconoResponsavel) || form.diaconoResponsavel : '',
      diaconoAuxiliar: form.diaconoAuxiliar ? getMembroNome(form.diaconoAuxiliar) || form.diaconoAuxiliar : '',
      responsavelContagem: form.responsavelContagem ? getMembroNome(form.responsavelContagem) || form.responsavelContagem : '',
      irmaoAtende: form.irmaoAtende || '',
      nomeServo: form.nomeServo || '',
      ministerioOrdenacao: form.ministerioOrdenacao || '',
      anciaoOrdena: form.anciaoOrdena ? getMembroNome(form.anciaoOrdena) || form.anciaoOrdena : '',
      nomeObreiro: form.nomeObreiro || '',
      ministerioObreiro: form.ministerioObreiro || '',
      anciaoApresenta: form.anciaoApresenta ? getMembroNome(form.anciaoApresenta) || form.anciaoApresenta : '',
    };
    
    // Se está editando, deletar o antigo e adicionar o novo
    if (editingEventId) {
      remover(editingEventId);
    }
    
    adicionar(formToSave);
    resetForm();
    setSubtipoReunioes('');
    setEditingEventId(null);
    setOpen(false);
  };

  const handleEdit = (evento: Evento) => {
    setEditingEventId(evento.id);
    setForm({
      titulo: evento.titulo || '',
      data: evento.data || '',
      horario: evento.horario || '',
      tipo: evento.tipo,
      congregacaoId: evento.congregacaoId || '',
      descricao: evento.descricao || '',
      anciaoAtende: evento.anciaoAtende || '',
      anciaoLocalidade: evento.anciaoLocalidade || '',
      encarregadoRegional: evento.encarregadoRegional || '',
      encarregadoLocalidade: evento.encarregadoLocalidade || '',
      diaconoResponsavel: evento.diaconoResponsavel || '',
      diaconoAuxiliar: evento.diaconoAuxiliar || '',
      responsavelContagem: evento.responsavelContagem || '',
      irmaoAtende: evento.irmaoAtende || '',
      nomeServo: evento.nomeServo || '',
      ministerioOrdenacao: evento.ministerioOrdenacao || '',
      anciaoOrdena: evento.anciaoOrdena || '',
      nomeObreiro: evento.nomeObreiro || '',
      ministerioObreiro: evento.ministerioObreiro || '',
      anciaoApresenta: evento.anciaoApresenta || '',
    });
    setSubtipoReunioes(evento.subtipoReuniao || '');
    setOpen(true);
  };

  const availableYears = [...new Set(eventos.map((e) => e.data.slice(0, 4)))].sort();

  const sorted = [...eventos]
    .filter((e) => {
      if (filterYear && e.data.slice(0, 4) !== filterYear) return false;
      if (filterMonth && e.data.slice(5, 7) !== filterMonth.padStart(2, '0')) return false;
      return true;
    })
    .sort((a, b) => a.data.localeCompare(b.data));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Agenda</h1>
          <p className="text-sm text-muted-foreground mt-1">Eventos e programações</p>
        </div>
        <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setForm({
              titulo: '',
              data: '',
              horario: '',
              tipo: 'Culto',
              congregacaoId: '',
              descricao: '',
              anciaoAtende: '',
              anciaoLocalidade: '',
              encarregadoRegional: '',
              encarregadoLocalidade: '',
              diaconoResponsavel: '',
              diaconoAuxiliar: '',
              responsavelContagem: '',
              irmaoAtende: '',
              nomeServo: '',
              ministerioOrdenacao: '',
              anciaoOrdena: '',
              nomeObreiro: '',
              ministerioObreiro: '',
              anciaoApresenta: '',
            });
            setSubtipoReunioes('');
            setEditingEventId(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Evento</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">{editingEventId ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Título do evento" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data</Label>
                  <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
                </div>
                <div>
                  <Label>Horário (opcional)</Label>
                  <Input type="time" value={form.horario} onChange={(e) => setForm({ ...form, horario: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={(v) => {
                    setForm({ ...form, tipo: v as Evento['tipo'] });
                    if (v !== 'Reunião') setSubtipoReunioes('');
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {tiposEvento.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {form.tipo === 'Reunião' && (
                <div>
                  <Label>Tipo de Reunião</Label>
                  <Select value={subtipoReunioes} onValueChange={setSubtipoReunioes}>
                    <SelectTrigger><SelectValue placeholder="Selecione o tipo de reunião" /></SelectTrigger>
                    <SelectContent>
                      {tiposReunioes.map((t) => <SelectItem key={t} value={t}>{getDisplayName(t)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {congregacoes.length > 0 && (
                <div>
                  <Label>Congregação (opcional)</Label>
                  <Select value={form.congregacaoId} onValueChange={(v) => setForm({ ...form, congregacaoId: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {[...congregacoes]
                        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                        .map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nome.toLowerCase().includes('central') ? `${c.nome} (${c.cidade})` : c.nome}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {subtipoReunioes === 'Batismo' && (
                <>
                  <div className="border-t border-border pt-4">
                    <h3 className="font-medium text-sm mb-3">Dados do Batismo</h3>
                  </div>
                  <div>
                    <Label>Irmão que Atende</Label>
                    <Input value={form.irmaoAtende} onChange={(e) => setForm({ ...form, irmaoAtende: e.target.value })} placeholder="Nome do irmão que atende" />
                  </div>
                </>
              )}
              {subtipoReunioes === 'Reunião para Mocidade' && (
                <>
                  <div className="border-t border-border pt-4">
                    <h3 className="font-medium text-sm mb-3">Dados da Reunião para Mocidade</h3>
                  </div>
                  <div>
                    <Label>Irmão que Atende</Label>
                    <Input value={form.irmaoAtende} onChange={(e) => setForm({ ...form, irmaoAtende: e.target.value })} placeholder="Nome do irmão que atende" />
                  </div>
                </>
              )}
              {subtipoReunioes === 'Busca dos Dons' && (
                <>
                  <div className="border-t border-border pt-4">
                    <h3 className="font-medium text-sm mb-3">Dados da Busca dos Dons</h3>
                  </div>
                  <div>
                    <Label>Irmão que Atende</Label>
                    <Input value={form.irmaoAtende} onChange={(e) => setForm({ ...form, irmaoAtende: e.target.value })} placeholder="Nome do irmão que atende" />
                  </div>
                </>
              )}
              {subtipoReunioes === 'Ordenação' && (
                <>
                  <div className="border-t border-border pt-4">
                    <h3 className="font-medium text-sm mb-3">Dados da Ordenação</h3>
                  </div>
                  <div>
                    <Label>Nome do Servo</Label>
                    <Input value={form.nomeServo} onChange={(e) => setForm({ ...form, nomeServo: e.target.value })} placeholder="Nome do irmão/irmã a ser ordenado(a)" />
                  </div>
                  <div>
                    <Label>Ministério</Label>
                    <Select value={form.ministerioOrdenacao} onValueChange={(v) => setForm({ ...form, ministerioOrdenacao: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione o ministério" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ancião">Ancião</SelectItem>
                        <SelectItem value="Diácono">Diácono</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Ancião que Ordena</Label>
                    <div className="space-y-2">
                      {!anciaoOutraLocalidade ? (
                        <Select value={form.anciaoOrdena} onValueChange={(v) => setForm({ ...form, anciaoOrdena: v })}>
                          <SelectTrigger><SelectValue placeholder="Selecione um ancião" /></SelectTrigger>
                          <SelectContent>
                            {[...membros]
                              .filter((m) => m.ministerio === 'Ancião')
                              .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                              .map((m) => (
                                <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={form.anciaoOrdena} onChange={(e) => setForm({ ...form, anciaoOrdena: e.target.value })} placeholder="Digite o nome do ancião" />
                      )}
                      <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <Checkbox checked={anciaoOutraLocalidade} onCheckedChange={(checked) => setAnciaoOutraLocalidade(checked === true)} />
                        <span>De outra localidade</span>
                      </label>
                    </div>
                  </div>
                </>
              )}
              {subtipoReunioes === 'Culto para Jovens' && (
                <>
                  <div className="border-t border-border pt-4">
                    <h3 className="font-medium text-sm mb-3">Dados do Culto para Jovens</h3>
                  </div>
                  <div>
                    <Label>Irmão que Atende</Label>
                    <Input value={form.irmaoAtende} onChange={(e) => setForm({ ...form, irmaoAtende: e.target.value })} placeholder="Nome do irmão que atende" />
                  </div>
                </>
              )}
              {subtipoReunioes === 'Ensaio Regional' && (
                <>
                  <div className="border-t border-border pt-4">
                    <h3 className="font-medium text-sm mb-3">Dados do Ensaio Regional</h3>
                  </div>
                  <div>
                    <Label>Ancião</Label>
                    <div className="space-y-2">
                      {!anciaoOutraLocalidade ? (
                        <Select value={form.anciaoAtende} onValueChange={(v) => setForm({ ...form, anciaoAtende: v })}>
                          <SelectTrigger><SelectValue placeholder="Selecione um ancião" /></SelectTrigger>
                          <SelectContent>
                            {[...membros]
                              .filter((m) => m.ministerio === 'Ancião')
                              .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                              .map((m) => (
                                <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={form.anciaoAtende} onChange={(e) => setForm({ ...form, anciaoAtende: e.target.value })} placeholder="Digite o nome do ancião" />
                      )}
                      <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <Checkbox checked={anciaoOutraLocalidade} onCheckedChange={(checked) => setAnciaoOutraLocalidade(checked === true)} />
                        <span>De outra localidade</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <Label>Encarregado Regional</Label>
                    <div className="space-y-2">
                      {!encarregadoOutraLocalidade ? (
                        <Select value={form.encarregadoRegional} onValueChange={(v) => setForm({ ...form, encarregadoRegional: v })}>
                          <SelectTrigger><SelectValue placeholder="Selecione um encarregado" /></SelectTrigger>
                          <SelectContent>
                            {[...membros]
                              .filter((m) => m.ministerio === 'Ancião')
                              .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                              .map((m) => (
                                <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={form.encarregadoRegional} onChange={(e) => setForm({ ...form, encarregadoRegional: e.target.value })} placeholder="Digite o nome do encarregado" />
                      )}
                      <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <Checkbox checked={encarregadoOutraLocalidade} onCheckedChange={(checked) => setEncarregadoOutraLocalidade(checked === true)} />
                        <span>De outra localidade</span>
                      </label>
                    </div>
                  </div>
                </>
              )}
              {subtipoReunioes === 'Santa-Ceia' && (
                <>
                  <div className="border-t border-border pt-4">
                    <h3 className="font-medium text-sm mb-3">Dados da Santa Ceia</h3>
                  </div>
                  <div>
                    <Label>Irmão que Atende</Label>
                    <Input value={form.irmaoAtende} onChange={(e) => setForm({ ...form, irmaoAtende: e.target.value })} placeholder="Nome do irmão que atende" />
                  </div>
                  <div>
                    <Label>Diácono Responsável</Label>
                    <div className="space-y-2">
                      {!diaconoResponsavelOutra ? (
                        <Select value={form.diaconoResponsavel} onValueChange={(v) => setForm({ ...form, diaconoResponsavel: v })}>
                          <SelectTrigger><SelectValue placeholder="Selecione um diácono" /></SelectTrigger>
                          <SelectContent>
                            {[...membros]
                              .filter((m) => m.ministerio === 'Diácono')
                              .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                              .map((m) => (
                                <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={form.diaconoResponsavel} onChange={(e) => setForm({ ...form, diaconoResponsavel: e.target.value })} placeholder="Digite o nome" />
                      )}
                      <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <Checkbox checked={diaconoResponsavelOutra} onCheckedChange={(checked) => setDiaconoResponsavelOutra(checked === true)} />
                        <span>De outra localidade</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <Label>Diácono Auxiliar</Label>
                    <div className="space-y-2">
                      {!diaconoAuxiliarOutra ? (
                        <Select value={form.diaconoAuxiliar} onValueChange={(v) => setForm({ ...form, diaconoAuxiliar: v })}>
                          <SelectTrigger><SelectValue placeholder="Selecione um diácono" /></SelectTrigger>
                          <SelectContent>
                            {[...membros]
                              .filter((m) => m.ministerio === 'Diácono')
                              .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                              .map((m) => (
                                <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={form.diaconoAuxiliar} onChange={(e) => setForm({ ...form, diaconoAuxiliar: e.target.value })} placeholder="Digite o nome" />
                      )}
                      <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <Checkbox checked={diaconoAuxiliarOutra} onCheckedChange={(checked) => setDiaconoAuxiliarOutra(checked === true)} />
                        <span>De outra localidade</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <Label>Responsável pela Contagem</Label>
                    <div className="space-y-2">
                      {!responsavelContagemOutra ? (
                        <Select value={form.responsavelContagem} onValueChange={(v) => setForm({ ...form, responsavelContagem: v })}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {[...membros].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map((m) => (
                              <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={form.responsavelContagem} onChange={(e) => setForm({ ...form, responsavelContagem: e.target.value })} placeholder="Digite o nome" />
                      )}
                      <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <Checkbox checked={responsavelContagemOutra} onCheckedChange={(checked) => setResponsavelContagemOutra(checked === true)} />
                        <span>De outra localidade</span>
                      </label>
                    </div>
                  </div>
                </>
              )}
              {subtipoReunioes === 'RJM com Busca dos Dons' && (
                <>
                  <div className="border-t border-border pt-4">
                    <h3 className="font-medium text-sm mb-3">Dados da RJM com Busca dos Dons</h3>
                  </div>
                  <div>
                    <Label>Irmão que Atende</Label>
                    <Input value={form.irmaoAtende} onChange={(e) => setForm({ ...form, irmaoAtende: e.target.value })} placeholder="Nome do irmão que atende" />
                  </div>
                </>
              )}
              {subtipoReunioes === 'Reunião de Jovens Agrupada' && (
                <>
                  <div className="border-t border-border pt-4">
                    <h3 className="font-medium text-sm mb-3">Dados da Reunião de Jovens Agrupada</h3>
                  </div>
                  <div>
                    <Label>Irmão que Atende</Label>
                    <Input value={form.irmaoAtende} onChange={(e) => setForm({ ...form, irmaoAtende: e.target.value })} placeholder="Nome do irmão que atende" />
                  </div>
                </>
              )}
              {subtipoReunioes === 'Reunião com Jovens Estudantes' && (
                <>
                  <div className="border-t border-border pt-4">
                    <h3 className="font-medium text-sm mb-3">Dados da Reunião com Jovens Estudantes</h3>
                  </div>
                  <div>
                    <Label>Irmão que Atende</Label>
                    <Input value={form.irmaoAtende} onChange={(e) => setForm({ ...form, irmaoAtende: e.target.value })} placeholder="Nome do irmão que atende" />
                  </div>
                </>
              )}
              {subtipoReunioes === 'Apresentação de Novos Obreiros' && (
                <>
                  <div className="border-t border-border pt-4">
                    <h3 className="font-medium text-sm mb-3">Dados da Apresentação</h3>
                  </div>
                  <div>
                    <Label>Nome do Irmão / Irmã</Label>
                    <Input value={form.nomeObreiro} onChange={(e) => setForm({ ...form, nomeObreiro: e.target.value })} placeholder="Nome do irmão ou irmã" />
                  </div>
                  <div>
                    <Label>Ministério</Label>
                    <Select value={form.ministerioObreiro} onValueChange={(v) => setForm({ ...form, ministerioObreiro: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione o ministério" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cooperador do Oficio Ministerial">Cooperador do Oficio Ministerial</SelectItem>
                        <SelectItem value="Cooperador de Jovens e Menores">Cooperador de Jovens e Menores</SelectItem>
                        <SelectItem value="Encarregado Regional">Encarregado Regional</SelectItem>
                        <SelectItem value="Encarregado Local">Encarregado Local</SelectItem>
                        <SelectItem value="Examinadora">Examinadora</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Ancião que Apresenta</Label>
                    <div className="space-y-2">
                      {!anciaoOutraLocalidade ? (
                        <Select value={form.anciaoApresenta} onValueChange={(v) => setForm({ ...form, anciaoApresenta: v })}>
                          <SelectTrigger><SelectValue placeholder="Selecione um ancião" /></SelectTrigger>
                          <SelectContent>
                            {[...membros]
                              .filter((m) => m.ministerio === 'Ancião')
                              .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                              .map((m) => (
                                <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={form.anciaoApresenta} onChange={(e) => setForm({ ...form, anciaoApresenta: e.target.value })} placeholder="Digite o nome do ancião" />
                      )}
                      <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <Checkbox checked={anciaoOutraLocalidade} onCheckedChange={(checked) => setAnciaoOutraLocalidade(checked === true)} />
                        <span>De outra localidade</span>
                      </label>
                    </div>
                  </div>
                </>
              )}
              {subtipoReunioes === 'AGO' && (
                <>
                  <div className="border-t border-border pt-4">
                    <h3 className="font-medium text-sm mb-3">Dados da AGO</h3>
                  </div>
                  <div>
                    <Label>Ancião que Atenderá</Label>
                    <div className="space-y-2">
                      {!anciaoOutraLocalidade ? (
                        <Select value={form.anciaoAtende} onValueChange={(v) => setForm({ ...form, anciaoAtende: v })}>
                          <SelectTrigger><SelectValue placeholder="Selecione um ancião" /></SelectTrigger>
                          <SelectContent>
                            {[...membros]
                              .filter((m) => m.ministerio === 'Ancião')
                              .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                              .map((m) => (
                                <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={form.anciaoAtende} onChange={(e) => setForm({ ...form, anciaoAtende: e.target.value })} placeholder="Digite o nome do ancião" />
                      )}
                      <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <Checkbox checked={anciaoOutraLocalidade} onCheckedChange={(checked) => setAnciaoOutraLocalidade(checked === true)} />
                        <span>De outra localidade</span>
                      </label>
                    </div>
                  </div>
                </>
              )}
              <div>
                <Label>Descrição</Label>
                <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Opcional" />
              </div>
              <div className="flex justify-end">
                <Button type="submit">Salvar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Botões de Tipos de Reuniões */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">Tipos de Reuniões</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {tiposReunioes.map((tipo) => {
            const config = tiposReuniaoConfig[tipo];
            const Icon = config.icon;
            const eventosCount = eventos.filter(e => e.subtipoReuniao === tipo).length;
            
            return (
              <button
                key={tipo}
                onClick={() => abrirComTipoReunioes(tipo)}
                className={`group relative glass-card rounded-xl p-4 border-2 transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95 bg-gradient-to-br ${config.gradient} ${config.borderColor} overflow-hidden`}
              >
                {/* Efeito de fundo animado */}
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Conteúdo */}
                <div className="relative z-10 flex flex-col items-center space-y-2">
                  {/* Ícone */}
                  <Icon className={`h-8 w-8 ${config.textColor} transition-transform group-hover:scale-110`} />
                  
                  {/* Título */}
                  <p className={`text-xs sm:text-sm font-semibold ${config.textColor} text-center leading-tight`}>
                    {getDisplayName(tipo)}
                  </p>
                  
                  {/* Badge com contador */}
                  {eventosCount > 0 && (
                    <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold ${config.borderColor} border`}>
                      <span className={config.textColor}>{eventosCount}</span>
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal de Visualização de Detalhes */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{selectedEvent?.subtipoReuniao ? getDisplayName(selectedEvent.subtipoReuniao) : selectedEvent?.titulo}</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Data</p>
                <p className="font-medium">{new Date(selectedEvent.data + 'T12:00:00').toLocaleDateString('pt-BR')} {selectedEvent.horario && `às ${selectedEvent.horario}`}</p>
              </div>
              {selectedEvent.titulo && (
                <div>
                  <p className="text-xs text-muted-foreground">Título</p>
                  <p className="font-medium">{selectedEvent.titulo}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Tipo</p>
                <Badge className={tipoCor[selectedEvent.tipo]}>{selectedEvent.tipo}</Badge>
              </div>
              {selectedEvent.anciaoAtende && (
                <div>
                  <p className="text-xs text-muted-foreground">Ancião</p>
                  <p className="font-medium">{selectedEvent.anciaoAtende} {selectedEvent.anciaoLocalidade && `(${selectedEvent.anciaoLocalidade})`}</p>
                </div>
              )}
              {selectedEvent.encarregadoRegional && (
                <div>
                  <p className="text-xs text-muted-foreground">Encarregado Regional</p>
                  <p className="font-medium">{selectedEvent.encarregadoRegional} {selectedEvent.encarregadoLocalidade && `(${selectedEvent.encarregadoLocalidade})`}</p>
                </div>
              )}
              {selectedEvent.irmaoAtende && (
                <div>
                  <p className="text-xs text-muted-foreground">Irmão que Atende</p>
                  <p className="font-medium">{selectedEvent.irmaoAtende}</p>
                </div>
              )}
              {selectedEvent.nomeServo && (
                <div>
                  <p className="text-xs text-muted-foreground">Nome do Servo</p>
                  <p className="font-medium">{selectedEvent.nomeServo}</p>
                </div>
              )}
              {selectedEvent.ministerioOrdenacao && (
                <div>
                  <p className="text-xs text-muted-foreground">Ministério</p>
                  <p className="font-medium">{selectedEvent.ministerioOrdenacao}</p>
                </div>
              )}
              {selectedEvent.anciaoOrdena && (
                <div>
                  <p className="text-xs text-muted-foreground">Ancião que Ordena</p>
                  <p className="font-medium">{selectedEvent.anciaoOrdena}</p>
                </div>
              )}
              {selectedEvent.nomeObreiro && (
                <div>
                  <p className="text-xs text-muted-foreground">Nome do Irmão / Irmã</p>
                  <p className="font-medium">{selectedEvent.nomeObreiro}</p>
                </div>
              )}
              {selectedEvent.ministerioObreiro && (
                <div>
                  <p className="text-xs text-muted-foreground">Ministério</p>
                  <p className="font-medium">{selectedEvent.ministerioObreiro}</p>
                </div>
              )}
              {selectedEvent.anciaoApresenta && (
                <div>
                  <p className="text-xs text-muted-foreground">Ancião que Apresenta</p>
                  <p className="font-medium">{selectedEvent.anciaoApresenta}</p>
                </div>
              )}
              {selectedEvent.diaconoResponsavel && (
                <div>
                  <p className="text-xs text-muted-foreground">Diácono Responsável</p>
                  <p className="font-medium">{selectedEvent.diaconoResponsavel}</p>
                </div>
              )}
              {selectedEvent.diaconoAuxiliar && (
                <div>
                  <p className="text-xs text-muted-foreground">Diácono Auxiliar</p>
                  <p className="font-medium">{selectedEvent.diaconoAuxiliar}</p>
                </div>
              )}
              {selectedEvent.responsavelContagem && (
                <div>
                  <p className="text-xs text-muted-foreground">Responsável pela Contagem</p>
                  <p className="font-medium">{selectedEvent.responsavelContagem}</p>
                </div>
              )}
              {selectedEvent.descricao && (
                <div>
                  <p className="text-xs text-muted-foreground">Descrição</p>
                  <p className="font-medium">{selectedEvent.descricao}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Filtros de Mês e Ano */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={filterYear || 'all'} onValueChange={(v) => setFilterYear(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os anos</SelectItem>
            {availableYears.map((y) => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterMonth || 'all'} onValueChange={(v) => setFilterMonth(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Mês" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os meses</SelectItem>
            {[
              { value: '1', label: 'Janeiro' },
              { value: '2', label: 'Fevereiro' },
              { value: '3', label: 'Março' },
              { value: '4', label: 'Abril' },
              { value: '5', label: 'Maio' },
              { value: '6', label: 'Junho' },
              { value: '7', label: 'Julho' },
              { value: '8', label: 'Agosto' },
              { value: '9', label: 'Setembro' },
              { value: '10', label: 'Outubro' },
              { value: '11', label: 'Novembro' },
              { value: '12', label: 'Dezembro' },
            ].map((m) => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(filterYear || filterMonth) && (
          <button
            onClick={() => { setFilterYear(''); setFilterMonth(''); }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <CalIcon className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-4 text-muted-foreground">Nenhum evento na agenda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((ev) => (
            <div key={ev.id} className="glass-card stat-card-hover rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="text-center min-w-[50px] flex-shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {new Date(ev.data + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase()}
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      {new Date(ev.data + 'T12:00:00').getDate()}
                    </p>
                  </div>
                  <div className="flex-1">
                    {ev.subtipoReuniao && (
                      <p className="font-semibold text-foreground text-lg">{getDisplayName(ev.subtipoReuniao)}</p>
                    )}
                    {ev.titulo && (
                      <p className="text-sm text-muted-foreground">{ev.titulo}</p>
                    )}
                    {ev.horario && (
                      <p className="text-xs text-muted-foreground mt-1">🕐 {ev.horario}</p>
                    )}
                    {ev.congregacaoId && (
                      <p className="text-xs text-muted-foreground mt-1">📍 {getCongregacaoNome(ev.congregacaoId)}</p>
                    )}
                    {ev.descricao && (
                      <p className="text-xs text-muted-foreground mt-1">{ev.descricao}</p>
                    )}
                    {ev.irmaoAtende && (
                      <p className="text-xs text-muted-foreground mt-1">👤 {ev.irmaoAtende}</p>
                    )}
                    {ev.nomeServo && (
                      <p className="text-xs text-muted-foreground mt-1">✝️ {ev.nomeServo}</p>
                    )}
                    {ev.nomeObreiro && (
                      <p className="text-xs text-muted-foreground mt-1">👤 {ev.nomeObreiro}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      setSelectedEvent(ev);
                      setViewModalOpen(true);
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1"
                    title="Visualizar detalhes"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleEdit(ev)}
                    className="text-muted-foreground hover:text-primary transition-colors p-1"
                    title="Editar evento"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button onClick={() => remover(ev.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="outline" className={tipoCor[ev.tipo]}>{ev.tipo}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
