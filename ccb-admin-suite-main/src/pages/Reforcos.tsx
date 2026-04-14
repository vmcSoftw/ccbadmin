import { useState } from 'react';
import { Plus, Trash2, ShieldCheck, AlertCircle, Edit2 } from 'lucide-react';
import { useReforcos, useCongregacoes, useMembros } from '@/hooks/useData';
import { Reforco, TipoMinisterio } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Reforcos() {
  const { reforcos, adicionar, remover, atualizar } = useReforcos();
  const { congregacoes } = useCongregacoes();
  const { membros } = useMembros();
  const [open, setOpen] = useState(false);
  const [editingReforcoId, setEditingReforcoId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showOutraLocalidade, setShowOutraLocalidade] = useState(false);
  const [showListaMembros, setShowListaMembros] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [novoMembroOutraLocalidade, setNovoMembroOutraLocalidade] = useState({ nome: '', localidade: '', ministerio: 'Ancião' as TipoMinisterio });
  const [filterTipo, setFilterTipo] = useState<'Culto' | 'RJM' | 'Todos'>('Todos');
  const [form, setForm] = useState({
    data: '',
    horario: '',
    tipo: 'Culto' as Reforco['tipo'],
    congregacaoId: '',
    membros: [] as string[],
    membrosOutrasLocalidades: [] as Array<{ nome: string; localidade: string; ministerio: TipoMinisterio }>,
    observacoes: '',
  });
  const [horarioAutoPreenchido, setHorarioAutoPreenchido] = useState(false);

  const toggleMembro = (id: string) => {
    setForm((f) => ({
      ...f,
      membros: f.membros.includes(id) ? f.membros.filter((m) => m !== id) : [...f.membros, id],
    }));
  };

  // Validar se já existe um reforço do mesmo tipo/congregação no mesmo mês
  const validateReforco = (data: string, tipo: Reforco['tipo'], congregacaoId: string): string | null => {
    if (!data) return null;

    // Obter a congregação
    const cong = congregacoes.find((c) => c.id === congregacaoId);

    // Validar se RJM está cadastrado na congregação
    if (tipo === 'RJM') {
      const temRJM = cong?.diasRJM && cong.diasRJM.length > 0;
      if (!temRJM) {
        const congNome = cong?.nome || 'Congregação';
        return `RJM não está cadastrado para ${congNome}. Configure os horários de RJM no cadastro da congregação antes de agendar reforços.`;
      }
    }

    const selectedDate = new Date(data + 'T12:00:00');
    const selectedMonth = selectedDate.getMonth();
    const selectedYear = selectedDate.getFullYear();
    const dayOfWeek = selectedDate.getDay(); // 0 = domingo, 4 = quinta-feira
    const isFifthDay = dayOfWeek === 4; // quinta-feira

    const isCentral = cong?.nome.toLowerCase().includes('central') && cong?.cidade === 'Ituiutaba';

    // Regra especial para Central de Ituiutaba:
    // - Máximo 2 CULTOS por mês (um DEVE ser na quinta-feira)
    // - Máximo 1 RJM por mês
    if (isCentral) {
      const reforçosNoMes = reforcos.filter((r) => {
        const reforcoDate = new Date(r.data + 'T12:00:00');
        return (
          reforcoDate.getMonth() === selectedMonth &&
          reforcoDate.getFullYear() === selectedYear &&
          r.congregacaoId === congregacaoId &&
          r.id !== editingReforcoId // Não contar o reforço sendo editado
        );
      });

      // Contar por tipo
      const cultosMes = reforçosNoMes.filter(r => r.tipo === 'Culto');
      const rjmMes = reforçosNoMes.filter(r => r.tipo === 'RJM');

      // Verificar se já existe um culto na quinta-feira
      const temCultoQuinta = cultosMes.some((r) => {
        const reforcoDate = new Date(r.data + 'T12:00:00');
        return reforcoDate.getDay() === 4;
      });

      // Validar limite de CULTOS
      if (tipo === 'Culto') {
        if (cultosMes.length >= 2) {
          const congNome = cong?.nome || 'Congregação';
          return `A ${congNome} já possui 2 CULTOS agendados no mês de ${selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}. Apenas 2 cultos por mês são permitidos.`;
        }

        // Se já tem 1 culto e este não é quinta-feira, e não existe culto de quinta marcado
        if (cultosMes.length === 1 && !isFifthDay && !temCultoQuinta) {
          const congNome = cong?.nome || 'Congregação';
          return `Já existe um CULTO agendado em ${selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })} para ${congNome}. O segundo culto DEVE ser impreterivelmente na quinta-feira.`;
        }
      }

      // Validar limite de RJM
      if (tipo === 'RJM') {
        if (rjmMes.length >= 1) {
          const congNome = cong?.nome || 'Congregação';
          return `A ${congNome} já possui 1 RJM agendada no mês de ${selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}. Apenas 1 RJM por mês é permitida para esta congregação.`;
        }
      }

      return null;
    }

    // Regra padrão: Apenas um reforço por tipo de culto por mês para outras congregações
    const conflicting = reforcos.find((r) => {
      const reforcoDate = new Date(r.data + 'T12:00:00');
      return (
        reforcoDate.getMonth() === selectedMonth &&
        reforcoDate.getFullYear() === selectedYear &&
        r.tipo === tipo &&
        r.congregacaoId === congregacaoId &&
        r.id !== editingReforcoId
      );
    });

    if (conflicting) {
      const congNome = cong?.nome || 'Congregação';
      return `Já existe um reforço de ${tipo} para ${congNome} em ${selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}. Apenas um reforço por tipo de culto por mês é permitido.`;
    }

    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.data || !form.congregacaoId || isSaving) return;

    const error = validateReforco(form.data, form.tipo, form.congregacaoId);
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError(null);
    setIsSaving(true);

    try {
      // Se está editando, atualizar o existente
      if (editingReforcoId) {
        atualizar(editingReforcoId, form);
      } else {
        // Se não está editando, adicionar novo
        adicionar(form);
      }
      
      setForm({ data: '', horario: '', tipo: 'Culto', congregacaoId: '', membros: [], membrosOutrasLocalidades: [], observacoes: '' });
      setShowOutraLocalidade(false);
      setNovoMembroOutraLocalidade({ nome: '', localidade: '', ministerio: 'Ancião' });
      setEditingReforcoId(null);
      setHorarioAutoPreenchido(false);
      setOpen(false);
    } catch (error) {
      console.error('Erro ao salvar reforço:', error);
      setValidationError('Erro ao salvar. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (reforco: Reforco) => {
    setEditingReforcoId(reforco.id);
    setForm({
      data: reforco.data,
      horario: reforco.horario || '',
      tipo: reforco.tipo,
      congregacaoId: reforco.congregacaoId,
      membros: reforco.membros || [],
      membrosOutrasLocalidades: reforco.membrosOutrasLocalidades || [],
      observacoes: reforco.observacoes || '',
    });
    setHorarioAutoPreenchido(false);
    setOpen(true);
  };

  const getCongNome = (id: string) => {
    const cong = congregacoes.find((c) => c.id === id);
    if (!cong) return '—';
    return cong.nome.toLowerCase().includes('central') ? `${cong.nome} - ${cong.cidade}` : cong.nome;
  };
  const getMembroNome = (id: string) => membros.find((m) => m.id === id)?.nome || '—';

  // Verificar se RJM está cadastrado para a congregação selecionada
  const temRJMCadastrado = form.congregacaoId 
    ? congregacoes.find(c => c.id === form.congregacaoId)?.diasRJM?.length ?? 0 > 0
    : false;

  const getDiaSemana = (data: string) => {
    const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return dias[new Date(data + 'T12:00:00').getDay()];
  };

  // Filtrar reforços por tipo
  const reforcosFiltrados = filterTipo === 'Todos' 
    ? reforcos 
    : reforcos.filter(r => r.tipo === filterTipo);

  // Filtrar apenas reforços com data futura ou de hoje (excluir os já realizados)
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const reforçosAtivos = reforcosFiltrados.filter(r => {
    return r.data >= today; // Comparação de strings funciona com formato ISO
  });

  // Ordenar reforços por data e depois por congregação
  const reforçosOrdenados = [...reforçosAtivos]
    .sort((a, b) => {
      const dateCmp = new Date(a.data).getTime() - new Date(b.data).getTime();
      if (dateCmp !== 0) return dateCmp;
      return getCongNome(a.congregacaoId).localeCompare(getCongNome(b.congregacaoId), 'pt-BR');
    });

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground">Reforços</h1>
            <p className="text-sm text-muted-foreground mt-1">Agendar atendimentos de cultos e RJM</p>
          </div>
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
              setValidationError(null);
              setShowOutraLocalidade(false);
              setShowListaMembros(false);
              setNovoMembroOutraLocalidade({ nome: '', localidade: '', ministerio: 'Ancião' });
              setForm({ data: '', horario: '', tipo: 'Culto', congregacaoId: '', membros: [], membrosOutrasLocalidades: [], observacoes: '' });
              setEditingReforcoId(null);
              setHorarioAutoPreenchido(false);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Reforço</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[calc(100vh-100px)] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display">{editingReforcoId ? 'Editar Reforço' : 'Novo Reforço'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-3">
                {validationError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{validationError}</AlertDescription>
                  </Alert>
                )}
                <div>
                  <Label>Congregação</Label>
                  <Select 
                    value={form.congregacaoId} 
                    onValueChange={(v) => {
                      // Se RJM estava selecionado mas a nova congregação não tem RJM, volta para Culto
                      const novasCong = congregacoes.find(c => c.id === v);
                      const novaTemRJM = novasCong?.diasRJM && novasCong.diasRJM.length > 0;
                      
                      setForm({ 
                        ...form, 
                        congregacaoId: v,
                        tipo: (form.tipo === 'RJM' && !novaTemRJM) ? 'Culto' : form.tipo
                      });
                      setValidationError(null);
                    }}
                  >
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
                <div>
                  <Label>Tipo</Label>
                  <Select 
                    value={form.tipo} 
                    onValueChange={(v) => {
                      setForm({ ...form, tipo: v as Reforco['tipo'] });
                      setValidationError(null);
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Culto">Culto</SelectItem>
                      <SelectItem value="RJM" disabled={!form.congregacaoId || !temRJMCadastrado}>
                        RJM {(!form.congregacaoId || !temRJMCadastrado) ? '(não configurado)' : ''}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {form.congregacaoId && !temRJMCadastrado && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                      ⚠️ RJM não está configurado para esta congregação
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Data</Label>
                    <Input 
                      type="date" 
                      value={form.data} 
                      onChange={(e) => {
                        const novaData = e.target.value;
                        setForm(prev => ({ ...prev, data: novaData }));
                        setValidationError(null);
                        
                        // Auto-preencher horário baseado no dia da semana
                        if (form.congregacaoId && novaData) {
                          const dataObj = new Date(novaData + 'T12:00:00');
                          const diaSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][dataObj.getDay()];
                          const cong = congregacoes.find(c => c.id === form.congregacaoId);
                          
                          const diasRelevantes = form.tipo === 'Culto' ? cong?.diasCultos : cong?.diasRJM;
                          const diaEncontrado = diasRelevantes?.find(d => d.diasemana === diaSemana);
                          
                          if (diaEncontrado && diaEncontrado.horario) {
                            setForm(prev => ({ ...prev, horario: diaEncontrado.horario }));
                            setHorarioAutoPreenchido(true);
                          }
                        }
                      }} 
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      Horário
                      {horarioAutoPreenchido && (
                        <Badge variant="secondary" className="text-xs">Auto</Badge>
                      )}
                    </Label>
                    <Input 
                      type="time" 
                      value={form.horario} 
                      onChange={(e) => {
                        setForm({ ...form, horario: e.target.value });
                        setHorarioAutoPreenchido(false);
                      }} 
                    />
                  </div>
                </div>
                {form.congregacaoId && (() => {
                  const cong = congregacoes.find(c => c.id === form.congregacaoId);
                  const diasCulto = cong?.diasCultos || [];
                  const diasRJM = cong?.diasRJM || [];
                  
                  return (diasCulto.length > 0 || diasRJM.length > 0) ? (
                    <div className="p-3 bg-muted/30 rounded-lg space-y-2 text-sm">
                      {diasCulto.length > 0 && (
                        <div>
                          <p className="font-medium text-foreground mb-1">Cultos:</p>
                          <div className="space-y-1 text-muted-foreground">
                            {diasCulto.map((d, idx) => (
                              <p key={idx}>• {d.diasemana} {d.horario} - {d.tipo}</p>
                            ))}
                          </div>
                        </div>
                      )}
                      {diasRJM.length > 0 && (
                        <div>
                          <p className="font-medium text-foreground mb-1">RJM:</p>
                          <div className="space-y-1 text-muted-foreground">
                            {diasRJM.map((d, idx) => (
                              <p key={idx}>• {d.diasemana} {d.horario} - {d.tipo}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null;
                })()}
                {membros.length > 0 && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setShowListaMembros(!showListaMembros)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors text-sm font-medium text-foreground"
                    >
                      <span>Irmão {form.membros.length > 0 && `(${form.membros.length})`}</span>
                      <span className="text-xs text-muted-foreground">{showListaMembros ? '▼' : '▶'}</span>
                    </button>
                    {showListaMembros && (
                      <div className="space-y-2 max-h-32 overflow-y-auto rounded-lg border border-border p-2 bg-muted/20">
                        {[...membros]
                          .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                          .map((m) => (
                          <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/30 p-1 rounded transition-colors">
                            <Checkbox
                              checked={form.membros.includes(m.id)}
                              onCheckedChange={() => toggleMembro(m.id)}
                            />
                            <span className="text-foreground">{m.nome}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={showOutraLocalidade}
                      onCheckedChange={(checked) => setShowOutraLocalidade(checked === true)}
                    />
                    <span className="text-sm font-medium">Irmão de outra localidade</span>
                  </label>
                </div>
                {showOutraLocalidade && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 bg-muted/30 rounded-lg">
                    <div>
                      <Label className="text-xs sm:text-sm">Nome do Irmão</Label>
                      <Input
                        placeholder="Digite o nome"
                        value={novoMembroOutraLocalidade.nome}
                        onChange={(e) => setNovoMembroOutraLocalidade({ ...novoMembroOutraLocalidade, nome: e.target.value })}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm">Localidade</Label>
                      <Input
                        placeholder="Digite a localidade"
                        value={novoMembroOutraLocalidade.localidade}
                        onChange={(e) => setNovoMembroOutraLocalidade({ ...novoMembroOutraLocalidade, localidade: e.target.value })}
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <Label className="text-xs sm:text-sm">Ministério</Label>
                      <Select 
                        value={novoMembroOutraLocalidade.ministerio} 
                        onValueChange={(v) => setNovoMembroOutraLocalidade({ ...novoMembroOutraLocalidade, ministerio: v as TipoMinisterio })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Ancião">Ancião</SelectItem>
                          <SelectItem value="Diácono">Diácono</SelectItem>
                          <SelectItem value="Cooperador do Ofício">Cooperador do Ofício</SelectItem>
                          <SelectItem value="Cooperador de Jovens e Menores">Cooperador de Jovens e Menores</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (novoMembroOutraLocalidade.nome && novoMembroOutraLocalidade.localidade) {
                            setForm({
                              ...form,
                              membrosOutrasLocalidades: [...form.membrosOutrasLocalidades, novoMembroOutraLocalidade],
                            });
                            setNovoMembroOutraLocalidade({ nome: '', localidade: '', ministerio: 'Ancião' });
                          }
                        }}
                        className="w-full text-xs sm:text-sm"
                      >
                        + Adicionar Irmão
                      </Button>
                    </div>
                    {form.membrosOutrasLocalidades.length > 0 && (
                      <div className="col-span-2 space-y-2">
                        {form.membrosOutrasLocalidades.map((m, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-background rounded border border-border text-sm">
                            <div>
                              <span className="font-medium">{m.nome}</span>
                              <span className="text-muted-foreground"> - {m.localidade} ({m.ministerio})</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setForm({
                                ...form,
                                membrosOutrasLocalidades: form.membrosOutrasLocalidades.filter((_, i) => i !== idx),
                              })}
                              className="text-destructive hover:text-destructive/80"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <Label>Observações</Label>
                  <Input value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Opcional" />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2">
          {(['Todos', 'Culto', 'RJM'] as const).map((tipo) => (
              <button
                key={tipo}
                onClick={() => setFilterTipo(tipo)}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filterTipo === tipo
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {tipo}
            </button>
          ))}
        </div>

        {reforçosOrdenados.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-4 text-muted-foreground">Nenhum reforço agendado.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reforçosOrdenados.map((r) => (
              <div key={r.id} className="glass-card stat-card-hover rounded-xl p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant="outline" className={`text-xs sm:text-sm flex-shrink-0 ${r.tipo === 'Culto' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-accent/20 text-accent-foreground border-accent/30'}`}>
                        {r.tipo}
                      </Badge>
                      <span className="text-xs sm:text-sm font-medium text-foreground truncate">{getCongNome(r.congregacaoId)}</span>
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                      <p>
                        <span className="font-medium">{new Date(r.data + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                        {' • '}
                        <span className="hidden sm:inline">{getDiaSemana(r.data)}</span>
                        <span className="sm:hidden">{getDiaSemana(r.data).slice(0, 3)}</span>
                        {r.horario && (' • ' + r.horario)}
                      </p>
                      {r.observacoes && <p className="italic line-clamp-2">{r.observacoes}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => handleEdit(r)} className="text-muted-foreground hover:text-primary transition-colors p-1" title="Editar reforço">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => remover(r.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1" title="Deletar reforço">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {(r.membros.length > 0 || (r.membrosOutrasLocalidades && r.membrosOutrasLocalidades.length > 0)) && (
                  <div className="mt-2 sm:mt-3 flex flex-wrap gap-1 sm:gap-1.5">
                    {[...r.membros]
                      .map((mid) => ({ mid, nome: getMembroNome(mid) }))
                      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                      .map(({ mid, nome }) => (
                        <span key={mid} className="rounded-full bg-muted px-2 sm:px-2.5 py-0.5 text-xs text-muted-foreground">
                          {nome}
                        </span>
                    ))}
                    {r.membrosOutrasLocalidades && r.membrosOutrasLocalidades.map((m, idx) => (
                      <span key={`outro-${idx}`} className="rounded-full bg-primary/10 px-2 sm:px-2.5 py-0.5 text-xs text-primary">
                        {m.nome} ({m.localidade} - {m.ministerio})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar com tabela de reforços */}
      <div className="w-full lg:w-96">
        <Card className="lg:sticky lg:top-6">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-semibold">Reforços Agendados - {filterTipo}</CardTitle>
          </CardHeader>
          <CardContent>
            {reforçosOrdenados.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhum reforço agendado</p>
            ) : (
              <div className="space-y-2 max-h-[50vh] sm:max-h-[calc(100vh-200px)] overflow-y-auto">
                {reforçosOrdenados.map((r) => (
                  <div key={r.id} className="border border-border rounded-lg p-2 sm:p-3 hover:bg-muted/30 transition-colors text-xs space-y-1 sm:space-y-1.5">
                    <div className="flex items-center justify-between gap-1 sm:gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground text-xs sm:text-sm truncate">
                          {new Date(r.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-muted-foreground text-xs truncate">
                          <span className="hidden sm:inline">{getDiaSemana(r.data)}</span>
                          <span className="sm:hidden">{getDiaSemana(r.data).slice(0, 3)}</span>
                          {r.horario && (' • ' + r.horario)}
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs flex-shrink-0 ${r.tipo === 'Culto' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-accent/20 text-accent-foreground border-accent/30'}`}
                      >
                        {r.tipo}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground font-medium text-xs sm:text-sm truncate">
                      {getCongNome(r.congregacaoId)}
                    </div>
                    {(r.membros.length > 0 || (r.membrosOutrasLocalidades && r.membrosOutrasLocalidades.length > 0)) && (
                      <div className="pt-1 sm:pt-1.5 border-t border-border">
                        <p className="text-muted-foreground font-medium mb-1">Irmãos:</p>
                        <div className="flex flex-wrap gap-1">
                          {[...r.membros]
                            .map((mid) => ({ mid, nome: getMembroNome(mid) }))
                            .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                            .map(({ mid, nome }) => (
                              <span key={mid} className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground text-xs truncate">
                                {nome}
                              </span>
                            ))}
                          {r.membrosOutrasLocalidades && r.membrosOutrasLocalidades.map((m, idx) => (
                            <span key={`outro-${idx}`} className="rounded bg-primary/10 px-1.5 py-0.5 text-primary text-xs truncate">
                              {m.nome} ({m.localidade} - {m.ministerio})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {r.observacoes && (
                      <div className="pt-1 sm:pt-1.5 border-t border-border text-muted-foreground italic text-xs line-clamp-2">
                        {r.observacoes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
