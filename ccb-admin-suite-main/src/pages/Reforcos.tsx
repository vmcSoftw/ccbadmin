import { useState } from 'react';
import { Plus, Trash2, ShieldCheck, AlertCircle, Edit2, RotateCcw, Upload, Download, CheckCircle2, Printer, FileSpreadsheet, FileText, Eye, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useReforcos, useCongregacoes, useMembros } from '@/hooks/useData';
import { Reforco, TipoMinisterio, Congregacao } from '@/types';
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

type RodizioItem = {
  congregacaoId: string;
  mes: number;
  ano: number;
  membroId: string;
  tipo: 'Culto';
};

type RodizioGerado = {
  ano: number;
  meses: number[];
  geradoEm: string;
  items: RodizioItem[];
};

function ultimaDataCultoNoMes(cong: Congregacao, ano: number, mes: number): string | null {
  const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const diasCultoIndices = (cong.diasCultos || [])
    .map((d) => diasSemana.indexOf(d.diasemana))
    .filter((i) => i >= 0);
  if (diasCultoIndices.length === 0) diasCultoIndices.push(0); // fallback: domingo
  // Cultos marcados no máximo até o dia 20 do mês
  for (let dia = 20; dia >= 1; dia--) {
    const date = new Date(ano, mes - 1, dia);
    if (diasCultoIndices.includes(date.getDay())) {
      return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    }
  }
  return null;
}

function gerarRodizioFn(
  congregacoesLista: Congregacao[],
  membroIds: string[],
  ano: number,
  meses: number[]
): RodizioGerado {
  const items: RodizioItem[] = [];
  const mesesOrdenados = [...meses].sort((a, b) => a - b);
  for (const mes of mesesOrdenados) {
    const membrosEmbaralhados = [...membroIds].sort(() => Math.random() - 0.5);
    congregacoesLista.forEach((cong, idx) => {
      items.push({
        congregacaoId: cong.id,
        mes,
        ano,
        membroId: membrosEmbaralhados[idx % membrosEmbaralhados.length],
        tipo: 'Culto',
      });
    });
  }
  return { ano, meses: mesesOrdenados, geradoEm: new Date().toISOString(), items };
}

const NOMES_MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

type MembroSimples = { id: string; nome: string };
type CongSimples = { id: string; nome: string };

function exportarRodizioXLSX(rodizio: RodizioGerado, congsLista: CongSimples[], membrosLista: MembroSimples[]) {
  const rows: (string | number)[][] = [['Mês', 'Congregação', 'Irmão']];
  for (const item of rodizio.items) {
    const cong = congsLista.find((c) => c.id === item.congregacaoId);
    const membro = membrosLista.find((m) => m.id === item.membroId);
    rows.push([`${NOMES_MESES[item.mes - 1]}/${item.ano}`, cong?.nome || item.congregacaoId, membro?.nome || item.membroId]);
  }
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 18 }, { wch: 35 }, { wch: 30 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rodízio');
  XLSX.writeFile(wb, `rodizio-${rodizio.ano}.xlsx`);
}

function exportarRodizioPDF(rodizio: RodizioGerado, congsLista: CongSimples[], membrosLista: MembroSimples[]) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(`Rodízio de Reforços — ${rodizio.ano}`, 14, 16);
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date(rodizio.geradoEm).toLocaleDateString('pt-BR')}`, 14, 24);
  const body = rodizio.items.map((item) => {
    const cong = congsLista.find((c) => c.id === item.congregacaoId);
    const membro = membrosLista.find((m) => m.id === item.membroId);
    return [`${NOMES_MESES[item.mes - 1]}/${item.ano}`, cong?.nome || item.congregacaoId, membro?.nome || item.membroId];
  });
  autoTable(doc, {
    head: [['Mês', 'Congregação', 'Irmão']],
    body,
    startY: 30,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });
  doc.save(`rodizio-${rodizio.ano}.pdf`);
}

function imprimirRodizio(rodizio: RodizioGerado, congsLista: CongSimples[], membrosLista: MembroSimples[]) {
  const rows = rodizio.items.map((item) => {
    const cong = congsLista.find((c) => c.id === item.congregacaoId);
    const membro = membrosLista.find((m) => m.id === item.membroId);
    return `<tr><td>${NOMES_MESES[item.mes - 1]}/${item.ano}</td><td>${cong?.nome || ''}</td><td>${membro?.nome || ''}</td></tr>`;
  }).join('');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Rodízio de Reforços — ${rodizio.ano}</title>
    <style>body{font-family:Arial,sans-serif;padding:20px}h2{margin-bottom:4px}p{margin:0 0 16px;font-size:12px;color:#666}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th{background:#2980b9;color:#fff;padding:8px;text-align:left}
    td{padding:6px 8px;border-bottom:1px solid #eee}tr:nth-child(even) td{background:#f5f5f5}</style>
  </head><body>
    <h2>Rodízio de Reforços — ${rodizio.ano}</h2>
    <p>Gerado em: ${new Date(rodizio.geradoEm).toLocaleDateString('pt-BR')}</p>
    <table><thead><tr><th>Mês</th><th>Congregação</th><th>Irmão</th></tr></thead>
    <tbody>${rows}</tbody></table>
  </body></html>`;
  const win = window.open('', '_blank');
  if (win) { win.document.write(html); win.document.close(); win.focus(); win.print(); }
}

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
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
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

  // Rodízio state
  const [openRodizio, setOpenRodizio] = useState(false);
  const [rodizioAno, setRodizioAno] = useState(new Date().getFullYear().toString());
  const [rodizioMeses, setRodizioMeses] = useState<number[]>([]);
  const [rodizioMembrosIds, setRodizioMembrosIds] = useState<string[]>([]);
  const [rodizioGerado, setRodizioGerado] = useState<RodizioGerado | null>(null);
  const [rodizioStep, setRodizioStep] = useState<'config' | 'preview' | 'resultado'>('config');

  // Importar rodízio state
  const [openImportarRodizio, setOpenImportarRodizio] = useState(false);
  const [rodizioImportado, setRodizioImportado] = useState<RodizioGerado | null>(null);
  const [rodizioImportStep, setRodizioImportStep] = useState<'import' | 'preview' | 'resultado'>('import');
  const [aplicandoRodizio, setAplicandoRodizio] = useState(false);
  const [resultadoAplicacao, setResultadoAplicacao] = useState<{ criados: number; ignorados: number; semData: number } | null>(null);

  // Estado para editar/visualizar item do rodízio
  const [editingRodizioIdx, setEditingRodizioIdx] = useState<{ globalIdx: number; membroId: string } | null>(null);
  const [viewingRodizioItem, setViewingRodizioItem] = useState<RodizioItem | null>(null);

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

  const availableYears = [...new Set(reforcos.map((r) => r.data.slice(0, 4)))].sort();

  // Filtrar apenas reforços com data futura ou de hoje (excluir os já realizados)
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const reforçosAtivos = reforcosFiltrados.filter(r => {
    if (filterYear && r.data.slice(0, 4) !== filterYear) return false;
    if (filterMonth && r.data.slice(5, 7) !== filterMonth.padStart(2, '0')) return false;
    if (!filterYear && !filterMonth) return r.data >= today;
    return true;
  });

  // Ordenar reforços por data e depois por congregação
  const reforçosOrdenados = [...reforçosAtivos]
    .sort((a, b) => {
      const dateCmp = new Date(a.data).getTime() - new Date(b.data).getTime();
      if (dateCmp !== 0) return dateCmp;
      return getCongNome(a.congregacaoId).localeCompare(getCongNome(b.congregacaoId), 'pt-BR');
    });

  const toggleRodizioMes= (mes: number) => {
    setRodizioMeses((prev) => prev.includes(mes) ? prev.filter((m) => m !== mes) : [...prev, mes]);
  };

  const toggleRodizioMembro = (id: string) => {
    setRodizioMembrosIds((prev) => prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]);
  };

  const handleGerarRodizio = () => {
    if (rodizioMeses.length === 0 || rodizioMembrosIds.length === 0) return;
    const gerado = gerarRodizioFn(
      [...congregacoes].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
      rodizioMembrosIds,
      parseInt(rodizioAno),
      rodizioMeses
    );
    setRodizioGerado(gerado);
    setRodizioStep('preview');
  };

  // Encontra o índice global de um item pelo mes+congregacaoId (para editar/excluir)
  const getGlobalIdx = (source: RodizioGerado, mes: number, congId: string) =>
    source.items.findIndex((it) => it.mes === mes && it.congregacaoId === congId);

  const handleEditarItemRodizio = (source: RodizioGerado, globalIdx: number) => {
    setEditingRodizioIdx({ globalIdx, membroId: source.items[globalIdx].membroId });
  };

  const handleSalvarEdicaoItem = (
    source: RodizioGerado,
    setter: (r: RodizioGerado) => void,
    globalIdx: number,
    novoMembroId: string
  ) => {
    const novosItems = source.items.map((it, i) => i === globalIdx ? { ...it, membroId: novoMembroId } : it);
    setter({ ...source, items: novosItems });
    setEditingRodizioIdx(null);
  };

  const handleExcluirItemRodizio = (
    source: RodizioGerado,
    setter: (r: RodizioGerado) => void,
    globalIdx: number
  ) => {
    const novosItems = source.items.filter((_, i) => i !== globalIdx);
    const mesesRestantes = [...new Set(novosItems.map((it) => it.mes))].sort((a, b) => a - b);
    setter({ ...source, items: novosItems, meses: mesesRestantes });
  };

  const handleExportarRodizio = (rodizio: RodizioGerado) => {
    const json = JSON.stringify(rodizio, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rodizio-${rodizio.ano}-meses-${rodizio.meses.join('-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportarRodizioFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as RodizioGerado;
        if (data.items && Array.isArray(data.items)) {
          setRodizioImportado(data);
          setResultadoAplicacao(null);
        } else {
          alert('Arquivo inválido: estrutura de rodízio não reconhecida.');
        }
      } catch {
        alert('Arquivo inválido. Selecione um arquivo JSON de rodízio exportado pelo sistema.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAplicarRodizio = async (rodizio: RodizioGerado) => {
    setAplicandoRodizio(true);
    let criados = 0;
    let ignorados = 0;
    let semData = 0;

    for (const item of rodizio.items) {
      const jaExiste = reforcos.some((r) => {
        const d = new Date(r.data + 'T12:00:00');
        return (
          r.congregacaoId === item.congregacaoId &&
          d.getMonth() + 1 === item.mes &&
          d.getFullYear() === item.ano &&
          r.tipo === item.tipo
        );
      });

      if (jaExiste) {
        ignorados++;
        continue;
      }

      const cong = congregacoes.find((c) => c.id === item.congregacaoId);
      if (!cong) continue;

      const data = ultimaDataCultoNoMes(cong, item.ano, item.mes);
      if (!data) {
        semData++;
        continue;
      }

      const diaSemanaStr = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][
        new Date(data + 'T12:00:00').getDay()
      ];
      const diaEncontrado = (cong.diasCultos || []).find((d) => d.diasemana === diaSemanaStr);

      await adicionar({
        data,
        horario: diaEncontrado?.horario || '',
        tipo: item.tipo,
        congregacaoId: item.congregacaoId,
        membros: [item.membroId],
        membrosOutrasLocalidades: [],
        observacoes: 'Criado por Rodízio',
      });
      criados++;
    }

    setAplicandoRodizio(false);
    setResultadoAplicacao({ criados, ignorados, semData });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground">Reforços</h1>
            <p className="text-sm text-muted-foreground mt-1">Agendar atendimentos de cultos e RJM</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" className="gap-2" onClick={() => { setOpenRodizio(true); setRodizioStep('config'); setRodizioGerado(null); setResultadoAplicacao(null); }}>
              <RotateCcw className="h-4 w-4" /> Rodízio
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => { setOpenImportarRodizio(true); setRodizioImportado(null); setRodizioImportStep('import'); setResultadoAplicacao(null); }}>
              <Upload className="h-4 w-4" /> Importar Rodízio
            </Button>
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
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 items-center">
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
          <Select value={filterYear || 'all'} onValueChange={(v) => setFilterYear(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-32 h-9">
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
            <SelectTrigger className="w-40 h-9">
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

      {/* Dialog Rodízio */}
      <Dialog open={openRodizio} onOpenChange={(isOpen) => {
        setOpenRodizio(isOpen);
        if (!isOpen) { setRodizioStep('config'); setRodizioGerado(null); setResultadoAplicacao(null); }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <RotateCcw className="h-5 w-5" /> Rodízio de Reforços
            </DialogTitle>
          </DialogHeader>

          {rodizioStep === 'config' && (
            <div className="space-y-4">
              <div>
                <Label>Ano</Label>
                <Input
                  type="number"
                  value={rodizioAno}
                  onChange={(e) => setRodizioAno(e.target.value)}
                  min="2020"
                  max="2099"
                  className="w-32 mt-1"
                />
              </div>
              <div>
                <Label className="mb-2 block">Meses</Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {NOMES_MESES.map((nome, idx) => (
                    <label key={idx + 1} className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded border border-border hover:bg-muted/30 transition-colors">
                      <Checkbox checked={rodizioMeses.includes(idx + 1)} onCheckedChange={() => toggleRodizioMes(idx + 1)} />
                      <span>{nome.slice(0, 3)}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-2 block">
                  Irmãos participantes{rodizioMembrosIds.length > 0 ? ` (${rodizioMembrosIds.length} selecionados)` : ''}
                </Label>
                {membros.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum irmão cadastrado no sistema.</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-2 space-y-1">
                    {[...membros].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map((m) => (
                      <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer p-1 rounded hover:bg-muted/30 transition-colors">
                        <Checkbox checked={rodizioMembrosIds.includes(m.id)} onCheckedChange={() => toggleRodizioMembro(m.id)} />
                        <span className="text-foreground">{m.nome}</span>
                        <span className="text-muted-foreground text-xs">({m.ministerio})</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleGerarRodizio}
                  disabled={rodizioMeses.length === 0 || rodizioMembrosIds.length === 0}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" /> Gerar Rodízio
                </Button>
              </div>
            </div>
          )}

          {rodizioStep === 'preview' && rodizioGerado && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-sm text-muted-foreground">
                  {rodizioGerado.items.length} atribuições · {congregacoes.length} congregações · {rodizioGerado.meses.length} mes(es)
                </p>
                <Button variant="outline" size="sm" onClick={() => setRodizioStep('config')}>
                  ← Reconfigurar
                </Button>
              </div>
              <div className="max-h-72 overflow-y-auto space-y-4 pr-1">
                {rodizioGerado.meses.map((mes) => (
                  <div key={mes}>
                    <h3 className="font-semibold text-sm mb-2 sticky top-0 bg-background py-1">
                      {NOMES_MESES[mes - 1]} / {rodizioGerado.ano}
                    </h3>
                    <div className="space-y-1">
                      {rodizioGerado.items
                        .filter((item) => item.mes === mes)
                        .map((item) => {
                          const cong = congregacoes.find((c) => c.id === item.congregacaoId);
                          const membro = membros.find((m) => m.id === item.membroId);
                          const globalIdx = getGlobalIdx(rodizioGerado, mes, item.congregacaoId);
                          const isEditing = editingRodizioIdx?.globalIdx === globalIdx;
                          return (
                            <div key={globalIdx} className="flex items-center justify-between text-sm p-2 rounded bg-muted/30 gap-2">
                              <span className="text-foreground truncate flex-1 min-w-0">{cong?.nome || '—'}</span>
                              {isEditing ? (
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <select
                                    className="text-xs border border-border rounded px-1 py-0.5 bg-background text-foreground"
                                    value={editingRodizioIdx.membroId}
                                    onChange={(e) => setEditingRodizioIdx({ globalIdx, membroId: e.target.value })}
                                  >
                                    {[...membros].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map((m) => (
                                      <option key={m.id} value={m.id}>{m.nome}</option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => handleSalvarEdicaoItem(rodizioGerado, setRodizioGerado, globalIdx, editingRodizioIdx.membroId)}
                                    className="text-xs text-primary font-medium hover:underline px-1"
                                  >✓</button>
                                  <button onClick={() => setEditingRodizioIdx(null)} className="text-xs text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /></button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <span className="text-primary font-medium text-xs">{membro?.nome || '—'}</span>
                                  <button
                                    title="Visualizar"
                                    onClick={() => setViewingRodizioItem(item)}
                                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                  ><Eye className="h-3.5 w-3.5" /></button>
                                  <button
                                    title="Editar"
                                    onClick={() => handleEditarItemRodizio(rodizioGerado, globalIdx)}
                                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                  ><Edit2 className="h-3.5 w-3.5" /></button>
                                  <button
                                    title="Excluir"
                                    onClick={() => handleExcluirItemRodizio(rodizioGerado, setRodizioGerado, globalIdx)}
                                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                  ><Trash2 className="h-3.5 w-3.5" /></button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 justify-end flex-wrap">
                <Button variant="outline" className="gap-2" onClick={() => imprimirRodizio(rodizioGerado, congregacoes, membros)}>
                  <Printer className="h-4 w-4" /> Imprimir
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => exportarRodizioXLSX(rodizioGerado, congregacoes, membros)}>
                  <FileSpreadsheet className="h-4 w-4" /> XLSX
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => exportarRodizioPDF(rodizioGerado, congregacoes, membros)}>
                  <FileText className="h-4 w-4" /> PDF
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => handleExportarRodizio(rodizioGerado)}>
                  <Download className="h-4 w-4" /> Exportar JSON
                </Button>
                <Button
                  className="gap-2"
                  disabled={aplicandoRodizio}
                  onClick={async () => {
                    await handleAplicarRodizio(rodizioGerado);
                    setRodizioStep('resultado');
                  }}
                >
                  {aplicandoRodizio ? 'Aplicando...' : <><CheckCircle2 className="h-4 w-4" /> Aplicar Rodízio</>}
                </Button>
              </div>
            </div>
          )}

          {rodizioStep === 'resultado' && resultadoAplicacao && (
            <div className="space-y-4">
              <div className="p-4 bg-primary/10 rounded-lg space-y-2">
                <p className="font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" /> Rodízio aplicado com sucesso!
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✅ {resultadoAplicacao.criados} reforço(s) criado(s)</li>
                  <li>⏭️ {resultadoAplicacao.ignorados} congregação(ões) já tinham reforço agendado (ignorado)</li>
                  {resultadoAplicacao.semData > 0 && (
                    <li>⚠️ {resultadoAplicacao.semData} congregação(ões) sem data de culto configurada</li>
                  )}
                </ul>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setRodizioStep('config'); setRodizioGerado(null); setResultadoAplicacao(null); }}>
                  Novo Rodízio
                </Button>
                <Button onClick={() => setOpenRodizio(false)}>Fechar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Importar Rodízio */}
      <Dialog open={openImportarRodizio} onOpenChange={(isOpen) => {
        setOpenImportarRodizio(isOpen);
        if (!isOpen) { setRodizioImportado(null); setRodizioImportStep('import'); setResultadoAplicacao(null); }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Upload className="h-5 w-5" /> Importar Rodízio
            </DialogTitle>
          </DialogHeader>

          {rodizioImportStep === 'import' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Selecione um arquivo JSON de rodízio exportado anteriormente pelo sistema.
              </p>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center space-y-3">
                <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Clique para selecionar o arquivo</p>
                <label htmlFor="rodizio-file-input">
                  <span className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 cursor-pointer transition-colors">
                    Selecionar arquivo JSON
                  </span>
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportarRodizioFile}
                  className="sr-only"
                  id="rodizio-file-input"
                />
              </div>
              {rodizioImportado && (
                <>
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Arquivo carregado: <strong>{rodizioImportado.items.length} atribuições</strong> para{' '}
                      <strong>{rodizioImportado.meses.length} meses</strong> de {rodizioImportado.ano}
                    </AlertDescription>
                  </Alert>
                  <div className="flex justify-end">
                    <Button onClick={() => setRodizioImportStep('preview')} className="gap-2">
                      Visualizar → Aplicar
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {rodizioImportStep === 'preview' && rodizioImportado && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-sm text-muted-foreground">
                  {rodizioImportado.items.length} atribuições · {rodizioImportado.meses.length} mes(es) de {rodizioImportado.ano}
                </p>
                <Button variant="outline" size="sm" onClick={() => setRodizioImportStep('import')}>
                  ← Voltar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Itens em amarelo já possuem reforço agendado e serão ignorados ao aplicar.
              </p>
              <div className="max-h-72 overflow-y-auto space-y-4 pr-1">
                {rodizioImportado.meses.map((mes) => (
                  <div key={mes}>
                    <h3 className="font-semibold text-sm mb-2 sticky top-0 bg-background py-1">
                      {NOMES_MESES[mes - 1]} / {rodizioImportado.ano}
                    </h3>
                    <div className="space-y-1">
                      {rodizioImportado.items
                        .filter((item) => item.mes === mes)
                        .map((item) => {
                          const cong = congregacoes.find((c) => c.id === item.congregacaoId);
                          const membro = membros.find((m) => m.id === item.membroId);
                          const globalIdx = getGlobalIdx(rodizioImportado, mes, item.congregacaoId);
                          const isEditing = editingRodizioIdx?.globalIdx === globalIdx;
                          const jaTemReforco = reforcos.some((r) => {
                            const d = new Date(r.data + 'T12:00:00');
                            return (
                              r.congregacaoId === item.congregacaoId &&
                              d.getMonth() + 1 === item.mes &&
                              d.getFullYear() === item.ano &&
                              r.tipo === item.tipo
                            );
                          });
                          return (
                            <div
                              key={globalIdx}
                              className={`flex items-center justify-between text-sm p-2 rounded gap-2 ${
                                jaTemReforco
                                  ? 'bg-yellow-50 dark:bg-yellow-900/20 opacity-70'
                                  : 'bg-muted/30'
                              }`}
                            >
                              <span className="text-foreground truncate flex-1 min-w-0">
                                {cong?.nome || item.congregacaoId}
                              </span>
                              {isEditing ? (
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <select
                                    className="text-xs border border-border rounded px-1 py-0.5 bg-background text-foreground"
                                    value={editingRodizioIdx.membroId}
                                    onChange={(e) => setEditingRodizioIdx({ globalIdx, membroId: e.target.value })}
                                  >
                                    {[...membros].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map((m) => (
                                      <option key={m.id} value={m.id}>{m.nome}</option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => handleSalvarEdicaoItem(rodizioImportado, setRodizioImportado, globalIdx, editingRodizioIdx.membroId)}
                                    className="text-xs text-primary font-medium hover:underline px-1"
                                  >✓</button>
                                  <button onClick={() => setEditingRodizioIdx(null)} className="text-xs text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /></button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <span className="text-primary font-medium text-xs">
                                    {membro?.nome || item.membroId}
                                  </span>
                                  {jaTemReforco && (
                                    <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-400">
                                      já agendado
                                    </Badge>
                                  )}
                                  <button
                                    title="Visualizar"
                                    onClick={() => setViewingRodizioItem(item)}
                                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                  ><Eye className="h-3.5 w-3.5" /></button>
                                  <button
                                    title="Editar"
                                    onClick={() => handleEditarItemRodizio(rodizioImportado, globalIdx)}
                                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                  ><Edit2 className="h-3.5 w-3.5" /></button>
                                  <button
                                    title="Excluir"
                                    onClick={() => handleExcluirItemRodizio(rodizioImportado, setRodizioImportado, globalIdx)}
                                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                  ><Trash2 className="h-3.5 w-3.5" /></button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 justify-end flex-wrap">
                <Button variant="outline" className="gap-2" onClick={() => imprimirRodizio(rodizioImportado, congregacoes, membros)}>
                  <Printer className="h-4 w-4" /> Imprimir
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => exportarRodizioXLSX(rodizioImportado, congregacoes, membros)}>
                  <FileSpreadsheet className="h-4 w-4" /> XLSX
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => exportarRodizioPDF(rodizioImportado, congregacoes, membros)}>
                  <FileText className="h-4 w-4" /> PDF
                </Button>
                <Button
                  className="gap-2"
                  disabled={aplicandoRodizio}
                  onClick={async () => {
                    await handleAplicarRodizio(rodizioImportado);
                    setRodizioImportStep('resultado');
                  }}
                >
                  {aplicandoRodizio ? 'Aplicando...' : <><CheckCircle2 className="h-4 w-4" /> Aplicar Rodízio</>}
                </Button>
              </div>
            </div>
          )}

          {rodizioImportStep === 'resultado' && resultadoAplicacao && (
            <div className="space-y-4">
              <div className="p-4 bg-primary/10 rounded-lg space-y-2">
                <p className="font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" /> Rodízio aplicado!
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✅ {resultadoAplicacao.criados} reforço(s) criado(s)</li>
                  <li>⏭️ {resultadoAplicacao.ignorados} congregação(ões) já tinham reforço agendado (ignorado)</li>
                  {resultadoAplicacao.semData > 0 && (
                    <li>⚠️ {resultadoAplicacao.semData} congregação(ões) sem data de culto configurada</li>
                  )}
                </ul>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setOpenImportarRodizio(false)}>Fechar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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

      {/* Dialog: Visualizar item de rodízio */}
      {viewingRodizioItem && (() => {
        const cong = congregacoes.find((c) => c.id === viewingRodizioItem.congregacaoId);
        const membro = membros.find((m) => m.id === viewingRodizioItem.membroId);
        const dataCulto = cong ? ultimaDataCultoNoMes(viewingRodizioItem.ano, viewingRodizioItem.mes, cong) : null;
        return (
          <Dialog open onOpenChange={() => setViewingRodizioItem(null)}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Detalhes do Rodízio</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Congregação</span>
                  <span className="font-medium text-right">{cong?.nome || viewingRodizioItem.congregacaoId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Irmão</span>
                  <span className="font-medium text-primary">{membro?.nome || viewingRodizioItem.membroId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Período</span>
                  <span className="font-medium">{NOMES_MESES[viewingRodizioItem.mes - 1]} / {viewingRodizioItem.ano}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo</span>
                  <Badge variant="outline">{viewingRodizioItem.tipo}</Badge>
                </div>
                {dataCulto && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data do culto</span>
                    <span className="font-medium">{dataCulto.toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
                {!dataCulto && (
                  <p className="text-xs text-muted-foreground italic">Data de culto não configurada para esta congregação.</p>
                )}
              </div>
              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setViewingRodizioItem(null)}>Fechar</Button>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}
    </div>
  );
}
