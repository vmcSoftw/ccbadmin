import { useState } from 'react';
import { Plus, Trash2, MapPin, Clock, Users, BookOpen } from 'lucide-react';
import { useCongregacoes, useMembros } from '@/hooks/useData';
import { Congregacao, DiaCulto, TipoCulto, MinisterioMembro, TipoMinisterioFuncao, DiaEnsaio, TipoEnsaioCongregacao } from '@/types';
import { formatarHora24 } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';

const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const tiposCulto: TipoCulto[] = ['Culto Oficial', 'Reunião de Jovens e Menores'];
const tiposMinisterio: TipoMinisterioFuncao[] = ['Ancião', 'Diácono', 'Cooperador do Ofício', 'Cooperador de Jovens e Menores'];
const tiposEnsaio: TipoEnsaioCongregacao[] = ['Local', 'Regional', 'DARPE', 'GEM', 'GERAL'];

const emptyForm: Omit<Congregacao, 'id'> = {
  nome: '',
  endereco: '',
  cidade: 'Ituiutaba',
  bairro: '',
  numeroRelatorio: '',
  diasCultos: [],
  diasRJM: [],
  diasEnsaios: [],
  ministerio: [],
};

const emptyDiaCulto: DiaCulto = {
  diasemana: '',
  horario: '19:00',
  tipo: 'Culto Oficial',
};

const emptyDiaEnsaio: Omit<DiaEnsaio, 'id'> = {
  semanaDoMes: 1,
  diaSemana: 'Segunda',
  horario: '19:00',
  tipo: 'Local',
  meses: [],
};

const emptyMinisterioMembro: Omit<MinisterioMembro, 'id'> = {
  nome: '',
  funcao: 'Ancião',
  ehLocalidade: false,
  ehResponsavel: false,
};

const removeRenderingErrorDuringEdit = (congregacao: Congregacao): typeof emptyForm => {
  return {
    nome: congregacao.nome || '',
    endereco: congregacao.endereco || '',
    cidade: congregacao.cidade || '',
    bairro: congregacao.bairro || '',
    numeroRelatorio: congregacao.numeroRelatorio || '',
    diasCultos: Array.isArray(congregacao.diasCultos) 
      ? congregacao.diasCultos 
      : [],
    diasRJM: Array.isArray(congregacao.diasRJM) 
      ? congregacao.diasRJM 
      : [],
    diasEnsaios: Array.isArray(congregacao.diasEnsaios)
      ? congregacao.diasEnsaios
      : [],
    ministerio: Array.isArray(congregacao.ministerio)
      ? congregacao.ministerio
      : [],
  };
};

// Função para calcular todas as datas de um padrão no ano corrente
function calcularDatasEnsaio(semanaDoMes: number, diaSemana: string, ano: number, meses: number[]): Date[] {
  const datas: Date[] = [];
  const indiceDia = diasSemana.indexOf(diaSemana);
  const mesesParaProcessar = meses.length > 0 ? meses : Array.from({ length: 12 }, (_, i) => i + 1); // Se vazio, usa todos
  
  for (const mes of mesesParaProcessar) {
    let contador = 0;
    
    for (let dia = 1; dia <= 31; dia++) {
      const data = new Date(ano, mes - 1, dia); // mes - 1 porque getMonth() é 0-indexed
      if (data.getMonth() !== mes - 1) break; // Parou de ser do mês
      
      if (data.getDay() === (indiceDia + 1) % 7) { // % 7 porque getDay() domingo=0
        contador++;
        if (contador === semanaDoMes) {
          datas.push(new Date(ano, mes - 1, dia));
          break;
        }
      }
    }
  }
  
  return datas.sort((a, b) => a.getTime() - b.getTime());
}

export default function Congregacoes() {
  const { congregacoes, adicionar, remover, atualizar } = useCongregacoes();
  const { membros } = useMembros();
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'cultos' | 'rjm' | 'ministerio' | 'ensaios'>('cultos');
  const [novoMembro, setNovoMembro] = useState<Omit<MinisterioMembro, 'id'>>(emptyMinisterioMembro);
  const [membroSelecionadoId, setMembroSelecionadoId] = useState<string>('');
  const [novoDiaEnsaio, setNovoDiaEnsaio] = useState<Omit<DiaEnsaio, 'id'>>(emptyDiaEnsaio);
  const [datasEnsaioVisualizado, setDatasEnsaioVisualizado] = useState<Date[]>([]);
  const [viewingCongregacao, setViewingCongregacao] = useState<Congregacao | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome) return;

    if (editingId) {
      atualizar(editingId, form);
      setEditingId(null);
    } else {
      adicionar(form);
    }

    setForm(emptyForm);
    setOpen(false);
  };

  const handleEdit = (congregacao: Congregacao) => {
    setForm(removeRenderingErrorDuringEdit(congregacao));
    setEditingId(congregacao.id);
    setOpen(true);
  };

  const addDiaCulto = () => {
    if (activeTab === 'cultos') {
      setForm({
        ...form,
        diasCultos: [...(form.diasCultos || []), { ...emptyDiaCulto }],
      });
    } else {
      setForm({
        ...form,
        diasRJM: [...(form.diasRJM || []), { ...emptyDiaCulto }],
      });
    }
  };

  const removeDiaCulto = (index: number) => {
    if (activeTab === 'cultos') {
      setForm({
        ...form,
        diasCultos: form.diasCultos?.filter((_, i) => i !== index) || [],
      });
    } else {
      setForm({
        ...form,
        diasRJM: form.diasRJM?.filter((_, i) => i !== index) || [],
      });
    }
  };

  const updateDiaCulto = (index: number, updates: Partial<DiaCulto>) => {
    const array = activeTab === 'cultos' ? form.diasCultos : form.diasRJM;
    if (array) {
      const updated = [...array];
      updated[index] = { ...updated[index], ...updates };
      if (activeTab === 'cultos') {
        setForm({ ...form, diasCultos: updated });
      } else {
        setForm({ ...form, diasRJM: updated });
      }
    }
  };

  const addDiaEnsaio = () => {
    if (!novoDiaEnsaio.diaSemana) return;
    const novoId = `ensaio_${Date.now()}`;
    const diaEnsaio: DiaEnsaio = {
      id: novoId,
      ...novoDiaEnsaio,
    };
    setForm({
      ...form,
      diasEnsaios: [...(form.diasEnsaios || []), diaEnsaio],
    });
    setNovoDiaEnsaio(emptyDiaEnsaio);
    setDatasEnsaioVisualizado([]);
  };

  const removeDiaEnsaio = (id: string) => {
    setForm({
      ...form,
      diasEnsaios: form.diasEnsaios?.filter((d) => d.id !== id) || [],
    });
    setDatasEnsaioVisualizado([]);
  };

  const atualizarPrevisaoDatas = (semana: number, dia: string) => {
    if (dia && semana) {
      const ano = new Date().getFullYear();
      const datas = calcularDatasEnsaio(semana, dia, ano, novoDiaEnsaio.meses);
      setDatasEnsaioVisualizado(datas);
    }
  };

  const addMinisterioMembro = () => {
    if (!membroSelecionadoId) return;
    const membroBD = membros.find((m) => m.id === membroSelecionadoId);
    if (!membroBD) return;
    
    const membro: MinisterioMembro = {
      id: membroBD.id,
      nome: membroBD.nome,
      funcao: novoMembro.funcao,
      ehLocalidade: novoMembro.ehLocalidade,
      ehResponsavel: novoMembro.ehResponsavel,
    };
    setForm({
      ...form,
      ministerio: [...(form.ministerio || []), membro],
    });
    setNovoMembro(emptyMinisterioMembro);
    setMembroSelecionadoId('');
  };

  const removeMinisterioMembro = (id: string) => {
    setForm({
      ...form,
      ministerio: form.ministerio?.filter((m) => m.id !== id) || [],
    });
  };

  const dias = activeTab === 'cultos' ? form.diasCultos : form.diasRJM;
  const ministerio = form.ministerio || [];
  const ensaios = form.diasEnsaios || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold font-display text-foreground">Congregações</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie as congregações da Administração
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setForm(emptyForm);
              setEditingId(null);
              setActiveTab('cultos');
              setNovoMembro(emptyMinisterioMembro);
              setMembroSelecionadoId('');
              setNovoDiaEnsaio(emptyDiaEnsaio);
              setDatasEnsaioVisualizado([]);
            }
            setOpen(isOpen);
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Nova Congregação
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingId ? 'Editar' : 'Nova'} Congregação
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Nome</Label>
                  <Input
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    placeholder="Nome da congregação"
                    required
                  />
                </div>
                <div>
                  <Label>Número de Relatório</Label>
                  <Input
                    value={form.numeroRelatorio || ''}
                    onChange={(e) => setForm({ ...form, numeroRelatorio: e.target.value })}
                    placeholder="Ex: 001"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Endereço</Label>
                  <Input
                    value={form.endereco}
                    onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                    placeholder="Rua, número"
                  />
                </div>
                <div>
                  <Label>Cidade</Label>
                  <Input
                    value={form.cidade}
                    onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Bairro</Label>
                  <Input
                    value={form.bairro}
                    onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                    placeholder="Bairro"
                  />
                </div>
              </div>

              <Separator />

              {/* Tabs para Cultos, RJM, Ensaios e Ministério */}
              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setActiveTab('cultos')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      activeTab === 'cultos'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    Cultos Oficiais
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('rjm')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      activeTab === 'rjm'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    Reunião de Jovens e Menores
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('ensaios')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      activeTab === 'ensaios'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    Ensaios
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('ministerio')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      activeTab === 'ministerio'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    Ministério
                  </button>
                </div>

                {/* Cultos e RJM */}
                {(activeTab === 'cultos' || activeTab === 'rjm') && (
                  <div className="space-y-3">
                    {!dias || dias.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        Nenhum dia adicionado
                      </p>
                    ) : (
                      dias.map((dia, idx) => (
                        <Card key={idx} className="p-3">
                          <div className="flex items-end gap-3">
                            <div className="flex-1 grid gap-3 sm:grid-cols-3">
                              <div>
                                <Label className="text-xs">Dia da Semana</Label>
                                <Select
                                  value={dia.diasemana}
                                  onValueChange={(value) =>
                                    updateDiaCulto(idx, { diasemana: value })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {diasSemana.map((d) => (
                                      <SelectItem key={d} value={d}>
                                        {d}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs">Horário (24h)</Label>
                                <Input
                                  type="time"
                                  value={dia.horario}
                                  onChange={(e) => {
                                    const hora = formatarHora24(e.target.value);
                                    updateDiaCulto(idx, { horario: hora });
                                  }}
                                  step="60"
                                  pattern="^([0-1][0-9]|2[0-3]):[0-5][0-9]$"
                                  placeholder="HH:mm"
                                  required
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Tipo</Label>
                                <Select
                                  value={dia.tipo}
                                  onValueChange={(value) =>
                                    updateDiaCulto(idx, { tipo: value as TipoCulto })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {tiposCulto.map((tipo) => (
                                      <SelectItem key={tipo} value={tipo}>
                                        {tipo}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDiaCulto(idx)}
                            >
                            <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </Card>
                      ))
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={addDiaCulto}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Adicionar Dia
                    </Button>
                  </div>
                )}

                {/* Ensaios */}
                {activeTab === 'ensaios' && (
                  <div className="space-y-4">
                    {/* Formulário para adicionar novo dia de ensaio */}
                    <Card className="p-4 bg-muted/30">
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-sm">Semana do Mês</Label>
                            <Select
                              value={String(novoDiaEnsaio.semanaDoMes)}
                              onValueChange={(value) => {
                                const semana = parseInt(value);
                                setNovoDiaEnsaio({ ...novoDiaEnsaio, semanaDoMes: semana });
                                atualizarPrevisaoDatas(semana, novoDiaEnsaio.diaSemana);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[1, 2, 3, 4, 5].map((semana) => (
                                  <SelectItem key={semana} value={String(semana)}>
                                    {semana}ª semana
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-sm">Dia da Semana</Label>
                            <Select
                              value={novoDiaEnsaio.diaSemana}
                              onValueChange={(value) => {
                                setNovoDiaEnsaio({ ...novoDiaEnsaio, diaSemana: value });
                                atualizarPrevisaoDatas(novoDiaEnsaio.semanaDoMes, value);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {diasSemana.map((dia) => (
                                  <SelectItem key={dia} value={dia}>
                                    {dia}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-sm">Horário (24h)</Label>
                            <Input
                              type="time"
                              value={novoDiaEnsaio.horario}
                              onChange={(e) => {
                                const hora = formatarHora24(e.target.value);
                                setNovoDiaEnsaio({ ...novoDiaEnsaio, horario: hora });
                              }}
                              step="60"
                              placeholder="HH:mm"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Tipo de Ensaio</Label>
                            <Select
                              value={novoDiaEnsaio.tipo}
                              onValueChange={(value) =>
                                setNovoDiaEnsaio({ ...novoDiaEnsaio, tipo: value as TipoEnsaioCongregacao })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {tiposEnsaio.map((tipo) => (
                                  <SelectItem key={tipo} value={tipo}>
                                    {tipo}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm">Selecionar Meses</Label>
                          <div className="grid grid-cols-3 gap-2 p-3 bg-background rounded-lg border border-border">
                            {[
                              { num: 1, nome: 'Jan' },
                              { num: 2, nome: 'Fev' },
                              { num: 3, nome: 'Mar' },
                              { num: 4, nome: 'Abr' },
                              { num: 5, nome: 'Mai' },
                              { num: 6, nome: 'Jun' },
                              { num: 7, nome: 'Jul' },
                              { num: 8, nome: 'Ago' },
                              { num: 9, nome: 'Set' },
                              { num: 10, nome: 'Out' },
                              { num: 11, nome: 'Nov' },
                              { num: 12, nome: 'Dez' },
                            ].map((mes) => (
                              <label key={mes.num} className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                  checked={novoDiaEnsaio.meses.includes(mes.num)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      const novosMeses = [...novoDiaEnsaio.meses, mes.num].sort((a, b) => a - b);
                                      setNovoDiaEnsaio({ ...novoDiaEnsaio, meses: novosMeses });
                                      atualizarPrevisaoDatas(novoDiaEnsaio.semanaDoMes, novoDiaEnsaio.diaSemana);
                                    } else {
                                      const novosMeses = novoDiaEnsaio.meses.filter((m) => m !== mes.num);
                                      setNovoDiaEnsaio({ ...novoDiaEnsaio, meses: novosMeses });
                                      atualizarPrevisaoDatas(novoDiaEnsaio.semanaDoMes, novoDiaEnsaio.diaSemana);
                                    }
                                  }}
                                />
                                <span className="text-sm">{mes.nome}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Prévia de datas */}
                        {datasEnsaioVisualizado.length > 0 && (
                          <div className="mt-4 p-3 bg-background rounded-lg border border-border">
                            <p className="text-xs font-semibold text-foreground mb-2">
                              Datas no ano de {new Date().getFullYear()}:
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {datasEnsaioVisualizado.map((data, idx) => (
                                <div key={idx} className="text-xs p-2 bg-muted rounded text-foreground text-center">
                                  {data.toLocaleDateString('pt-BR')}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <Button
                          type="button"
                          onClick={addDiaEnsaio}
                          className="w-full"
                          variant="secondary"
                        >
                          <Plus className="h-4 w-4 mr-2" /> Adicionar Dia de Ensaio
                        </Button>
                      </div>
                    </Card>

                    {/* Lista de dias de ensaio */}
                    <div className="space-y-2">
                      {ensaios.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                          Nenhum dia de ensaio adicionado
                        </p>
                      ) : (
                        ensaios.map((ensaio) => (
                          <Card key={ensaio.id} className="p-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-foreground">
                                  {ensaio.semanaDoMes}ª semana · {ensaio.diaSemana} · {ensaio.horario}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Tipo: {ensaio.tipo}
                                </p>
                                {ensaio.meses && ensaio.meses.length > 0 && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Meses: {ensaio.meses.join(', ')}
                                  </p>
                                )}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeDiaEnsaio(ensaio.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Ministério */}
                {activeTab === 'ministerio' && (
                  <div className="space-y-4">
                    {/* Formulário para adicionar novo membro */}
                    <Card className="p-4 bg-muted/30">
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm">Função</Label>
                          <Select
                            value={novoMembro.funcao}
                            onValueChange={(value) => {
                              setNovoMembro({ ...novoMembro, funcao: value as TipoMinisterioFuncao });
                              setMembroSelecionadoId(''); // Limpar seleção ao trocar função
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {tiposMinisterio.map((tipo) => (
                                <SelectItem key={tipo} value={tipo}>
                                  {tipo}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm">Selecionar Membro</Label>
                          <Select value={membroSelecionadoId} onValueChange={setMembroSelecionadoId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Escolha um membro..." />
                            </SelectTrigger>
                            <SelectContent>
                              {[...membros]
                                .filter((m) => m.ministerio === novoMembro.funcao)
                                .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                                .map((m) => (
                                  <SelectItem key={m.id} value={m.id}>
                                    {m.nome}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          {novoMembro.funcao && membros.filter((m) => m.ministerio === novoMembro.funcao).length === 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Nenhum membro cadastrado para esta função
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={novoMembro.ehLocalidade}
                              onCheckedChange={(checked) =>
                                setNovoMembro({ ...novoMembro, ehLocalidade: checked === true })
                              }
                            />
                            <span className="text-sm text-foreground">É da localidade</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={novoMembro.ehResponsavel}
                              onCheckedChange={(checked) =>
                                setNovoMembro({ ...novoMembro, ehResponsavel: checked === true })
                              }
                            />
                            <span className="text-sm text-foreground">É responsável pela localidade</span>
                          </label>
                        </div>
                        <Button
                          type="button"
                          onClick={addMinisterioMembro}
                          className="w-full"
                          variant="secondary"
                        >
                          <Plus className="h-4 w-4 mr-2" /> Adicionar Membro
                        </Button>
                      </div>
                    </Card>

                    {/* Lista de membros */}
                    <div className="space-y-2">
                      {ministerio.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                          Nenhum membro do ministério adicionado
                        </p>
                      ) : (
                        [...ministerio]
                          .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                          .map((membro) => (
                          <Card key={membro.id} className="p-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex-1">
                                <p className={`text-sm ${membro.ehResponsavel ? 'italic' : ''} ${membro.ehLocalidade ? 'font-bold' : ''}`}>
                                  {membro.nome}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {membro.funcao}
                                  {membro.ehLocalidade && ' • Da localidade'}
                                  {membro.ehResponsavel && ' • Responsável'}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeMinisterioMembro(membro.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setForm(emptyForm);
                    setEditingId(null);
                    setOpen(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingId ? 'Atualizar' : 'Criar'} Congregação
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campo de Busca */}
      <div>
        <Input
          placeholder="🔍 Buscar congregação..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Lista de Congregações */}
      {congregacoes.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <MapPin className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-4 text-muted-foreground">Nenhuma congregação cadastrada.</p>
        </div>
      ) : [...congregacoes].filter((c) => c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || c.cidade.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <MapPin className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-4 text-muted-foreground">Nenhuma congregação encontrada com "{searchTerm}"</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...congregacoes]
            .filter((c) => c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || c.cidade.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
            .map((c) => {
              const isCentral = c.nome.toLowerCase().includes('central');
              return (
                <div key={c.id} className="glass-card stat-card-hover rounded-xl p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground font-display text-lg">{c.nome}</h3>
                        {isCentral && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                            {c.cidade}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setViewingCongregacao(c)}
                        className="text-muted-foreground hover:text-primary transition-colors p-1"
                        title="Visualizar"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => handleEdit(c)}
                        className="text-muted-foreground hover:text-primary transition-colors p-1"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => remover(c.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      {c.endereco ? `${c.endereco}, ${c.bairro}` : c.bairro || 'Sem endereço'}
                    </p>
                    <div className="text-xs text-muted-foreground/60">{c.cidade}</div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Modal de Visualização */}
      {viewingCongregacao && (
        <Dialog open={!!viewingCongregacao} onOpenChange={() => setViewingCongregacao(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">{viewingCongregacao.nome}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Endereço */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Informações Gerais</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>Endereço:</strong> {viewingCongregacao.endereco}</p>
                  <p><strong>Bairro:</strong> {viewingCongregacao.bairro}</p>
                  <p><strong>Cidade:</strong> {viewingCongregacao.cidade}</p>
                  {viewingCongregacao.numeroRelatorio && (
                    <p><strong>Número de Relatório:</strong> {viewingCongregacao.numeroRelatorio}</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Cultos */}
              {viewingCongregacao.diasCultos && viewingCongregacao.diasCultos.length > 0 && (
                <>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4" /> Cultos Oficiais
                    </h4>
                    <div className="space-y-2">
                      {viewingCongregacao.diasCultos.map((culto, idx) => (
                        <Card key={idx} className="p-3 bg-muted/30">
                          <p className="text-sm font-medium">{culto.diasemana} - {formatarHora24(culto.horario)}</p>
                          <p className="text-xs text-muted-foreground">{culto.tipo}</p>
                        </Card>
                      ))}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* RJM */}
              {viewingCongregacao.diasRJM && viewingCongregacao.diasRJM.length > 0 && (
                <>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Users className="h-4 w-4" /> Reunião de Jovens e Menores
                    </h4>
                    <div className="space-y-2">
                      {viewingCongregacao.diasRJM.map((rjm, idx) => (
                        <Card key={idx} className="p-3 bg-muted/30">
                          <p className="text-sm font-medium">{rjm.diasemana} - {formatarHora24(rjm.horario)}</p>
                          <p className="text-xs text-muted-foreground">{rjm.tipo}</p>
                        </Card>
                      ))}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Ensaios */}
              {viewingCongregacao.diasEnsaios && viewingCongregacao.diasEnsaios.length > 0 && (
                <>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <BookOpen className="h-4 w-4" /> Ensaios
                    </h4>
                    <div className="space-y-2">
                      {viewingCongregacao.diasEnsaios.map((ensaio) => (
                        <Card key={ensaio.id} className="p-3 bg-muted/30">
                          <p className="text-sm font-medium">{ensaio.tipo}</p>
                          <p className="text-xs text-muted-foreground">
                            {ensaio.diaSemana} - {formatarHora24(ensaio.horario)} • Semana {ensaio.semanaDoMes}
                          </p>
                        </Card>
                      ))}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Ministério */}
              {viewingCongregacao.ministerio && viewingCongregacao.ministerio.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Users className="h-4 w-4" /> Ministério
                  </h4>
                  <div className="space-y-2">
                    {viewingCongregacao.ministerio
                      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                      .map((membro) => (
                        <Card key={membro.id} className="p-3 bg-muted/30">
                          <p className={`text-sm ${membro.ehResponsavel ? 'italic' : ''} ${membro.ehLocalidade ? 'font-bold' : ''}`}>
                            {membro.nome}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {membro.funcao}
                            {membro.ehLocalidade && ' • Da localidade'}
                            {membro.ehResponsavel && ' • Responsável'}
                          </p>
                        </Card>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}