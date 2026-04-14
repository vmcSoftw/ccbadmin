import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Check, X, Calendar, Clock, MapPin, Eye, Edit, FileText, Download, Settings } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { useEventos, useCongregacoes, useMembros } from '@/hooks/useData';
import { Evento } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface SantaCeiaForm extends Evento {
  anciaoAtende1?: string;
  anciaoAtende2?: string;
  diaconoAuxiliar1?: string;
  diaconoAuxiliar2?: string;
}

export default function SantaCeia() {
  const { eventos, adicionar, remover, atualizar } = useEventos();
  const { congregacoes } = useCongregacoes();
  const { membros } = useMembros();
  const tableRef = useRef<HTMLDivElement>(null);
  const pdfPreviewRef = useRef<HTMLDivElement>(null);
  
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [selectedSantaCeia, setSelectedSantaCeia] = useState<Evento | null>(null);
  const [editingForm, setEditingForm] = useState<SantaCeiaForm | null>(null);
  const [showOutraLocalidadeAnciao, setShowOutraLocalidadeAnciao] = useState(false);
  const [showOutraLocalidadeDiacono, setShowOutraLocalidadeDiacono] = useState(false);
  const [novoAnciao, setNovoAnciao] = useState({ nome: '', localidade: '' });
  const [novoDiacono, setNovoDiacono] = useState({ nome: '', localidade: '' });
  const [anciaoOutraLocalidade, setAnciaosOutraLocalidade] = useState<Array<{ nome: string; localidade: string }>>([]);
  const [diaconoOutraLocalidade, setDiaconosOutraLocalidade] = useState<Array<{ nome: string; localidade: string }>>([]);
  const [form, setForm] = useState({
    titulo: 'Santa Ceia',
    data: '',
    horario: '03:00',
    congregacaoId: congregacoes[0]?.id || '',
    anciaoAtende1: '',
    anciaoAtende2: '',
    diaconoResponsavel: '',
    diaconoAuxiliar1: '',
    diaconoAuxiliar2: '',
    responsavelContagem: '',
  })

  // Estados de configuração do Preview
  const [configOpen, setConfigOpen] = useState(false);
  const [previewConfig, setPreviewConfig] = useState({
    cellHeight: 'grande' as 'pequeno' | 'normal' | 'grande',
    fontSize: 'grande' as 'pequeno' | 'normal' | 'grande',
    bold: true,
    sortBy: 'data' as 'data' | 'congregacao' | 'anciao',
  });

  // Filtrar apenas eventos de Santa Ceia
  const santaCeias = eventos.filter(e => e.subtipoReuniao === 'Santa-Ceia' || (e.tipo === 'Reunião' && e.subtipoReuniao === 'Santa-Ceia'));

  // Migração automática de datas de 2025 para 2026
  useEffect(() => {
    const migrarDatas = async () => {
      for (const evento of santaCeias) {
        const ano = new Date(evento.data).getFullYear();
        if (ano === 2025) {
          const data2025 = new Date(evento.data);
          const novaData = new Date(data2025);
          novaData.setFullYear(2026);
          const dataFormatada = novaData.toISOString().split('T')[0];
          try {
            await atualizar(evento.id, { data: dataFormatada });
          } catch (e) {
            console.error('Erro ao migrar data:', e);
          }
        }
      }
    };
    
    if (santaCeias.length > 0) {
      migrarDatas();
    }
  }, [santaCeias, atualizar]);

  const getCongregacaoNome = (id: string) => {
    const cong = congregacoes.find(c => c.id === id);
    if (!cong) return 'Sem localidade';
    return cong.nome.toLowerCase().includes('central')
      ? `${cong.nome} - ${cong.cidade}`
      : cong.nome;
  };

  const getMembrosAnciaos = () => {
    return membros.filter(m => m.ministerio === 'Ancião');
  };

  const getMembrosD = () => {
    return membros.filter(m => m.ministerio === 'Diácono');
  };

  const getNomeComLocalidade = (membro: typeof membros[0]) => {
    const cong = congregacoes.find(c => c.id === membro.congregacaoId);
    if (!cong) return membro.nome;
    return `${membro.nome} (${cong.nome})`;
  };

  const handleSubmit = () => {
    if (!form.data || !form.congregacaoId) {
      alert('Preencha data e congregação');
      return;
    }

    // Combinar anciões: selecionados e de outra localidade
    const anciaosSelecionados = [form.anciaoAtende1, form.anciaoAtende2].filter(Boolean);
    const anciaosFormatados = anciaosSelecionados.concat(anciaoOutraLocalidade.map(a => `${a.nome} (${a.localidade})`));
    
    // Combinar diáconos: selecionados e de outra localidade
    const diaconosSelecionados = [form.diaconoResponsavel, form.diaconoAuxiliar1, form.diaconoAuxiliar2].filter(Boolean);
    const diaconosFormatados = diaconosSelecionados.concat(diaconoOutraLocalidade.map(d => `${d.nome} (${d.localidade})`));

    const novoEvento = {
      titulo: form.titulo,
      data: form.data,
      horario: form.horario,
      tipo: 'Reunião' as const,
      subtipoReuniao: 'Santa-Ceia',
      congregacaoId: form.congregacaoId,
      anciaoAtende: anciaosFormatados.sort().join(', ') || '',
      diaconoResponsavel: form.diaconoResponsavel,
      diaconoAuxiliar: diaconosFormatados.filter((_, i) => i > 0).sort().join(', ') || '',
      responsavelContagem: form.responsavelContagem,
    };

    adicionar(novoEvento);
    setForm({
      titulo: 'Santa Ceia',
      data: '',
      horario: '03:00',
      congregacaoId: congregacoes[0]?.id || '',
      anciaoAtende1: '',
      anciaoAtende2: '',
      diaconoResponsavel: '',
      diaconoAuxiliar1: '',
      diaconoAuxiliar2: '',
      responsavelContagem: '',
    });
    setAnciaosOutraLocalidade([]);
    setDiaconosOutraLocalidade([]);
    setShowOutraLocalidadeAnciao(false);
    setShowOutraLocalidadeDiacono(false);
    setNovoAnciao({ nome: '', localidade: '' });
    setNovoDiacono({ nome: '', localidade: '' });
    setOpen(false);
  };

  const handleViewDetails = (santaCeia: Evento) => {
    setSelectedSantaCeia(santaCeia);
    setDetailsOpen(true);
  };

  const handleEdit = (santaCeia: Evento) => {
    setSelectedSantaCeia(santaCeia);
    setEditingForm({
      ...santaCeia,
      anciaoAtende1: santaCeia.anciaoAtende?.split(', ')[0] || '',
      anciaoAtende2: santaCeia.anciaoAtende?.split(', ')[1] || '',
      diaconoAuxiliar1: santaCeia.diaconoAuxiliar?.split(', ')[0] || '',
      diaconoAuxiliar2: santaCeia.diaconoAuxiliar?.split(', ')[1] || '',
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingForm.data || !editingForm.congregacaoId) {
      alert('Preencha data e congregação');
      return;
    }

    await remover(editingForm.id);
    const { id, ...eventoSemId } = editingForm;
    
    // Combinar anciões: selecionados e de outra localidade
    const anciaosSelecionados = [editingForm.anciaoAtende1, editingForm.anciaoAtende2].filter(Boolean);
    const anciaosFormatados = anciaosSelecionados.concat(anciaoOutraLocalidade.map(a => `${a.nome} (${a.localidade})`));
    
    // Combinar diáconos: selecionados e de outra localidade
    const diaconosSelecionados = [editingForm.diaconoResponsavel, editingForm.diaconoAuxiliar1, editingForm.diaconoAuxiliar2].filter(Boolean);
    const diaconosFormatados = diaconosSelecionados.concat(diaconoOutraLocalidade.map(d => `${d.nome} (${d.localidade})`));

    const updatedEvento = {
      ...eventoSemId,
      anciaoAtende: anciaosFormatados.sort().join(', ') || '',
      diaconoAuxiliar: diaconosFormatados.filter((_, i) => i > 0).sort().join(', ') || '',
    };
    adicionar(updatedEvento);
    setEditOpen(false);
    setEditingForm(null);
    setAnciaosOutraLocalidade([]);
    setDiaconosOutraLocalidade([]);
    setShowOutraLocalidadeAnciao(false);
    setShowOutraLocalidadeDiacono(false);
    setNovoAnciao({ nome: '', localidade: '' });
    setNovoDiacono({ nome: '', localidade: '' });
  };

  const handleDeleteConfirm = async () => {
    if (selectedSantaCeia && !isDeleting) {
      setIsDeleting(true);
      try {
        console.log('Tentando deletar evento com ID:', selectedSantaCeia.id);
        console.log('Evento completo:', selectedSantaCeia);
        
        await remover(selectedSantaCeia.id);
        
        console.log('Evento deletado com sucesso!');
        setDeleteConfirmOpen(false);
        setSelectedSantaCeia(null);
        setIsDeleting(false);
        alert('Santa Ceia deletada com sucesso!');
      } catch (error) {
        console.error('Erro ao deletar Santa Ceia:', error);
        const errorMessage = error instanceof Error ? error.message : 'Tente novamente.';
        const errorCode = error instanceof Object && 'code' in error ? (error as Record<string, unknown>).code : undefined;
        console.error('Detalhes do erro:', errorCode, errorMessage);
        alert(`Erro ao deletar: ${errorMessage}`);
        setIsDeleting(false);
      }
    }
  };

  const abrirPreviewPDF = () => {
    setShowPdfPreview(true);
  };

  const gerarPDFFinal = async () => {
    if (!pdfPreviewRef.current) return;
    try {
      // Aguardar renderização completa
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const canvas = await html2canvas(pdfPreviewRef.current, { 
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        allowTaint: true
      });
      
      const pdf = new jsPDF('l', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 297 - 16;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;
      
      // Adicionar múltiplas páginas se necessário
      pdf.addImage(imgData, 'PNG', 8, position + 8, imgWidth, imgHeight);
      heightLeft -= 200;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 8, position + 8, imgWidth, imgHeight);
        heightLeft -= 200;
      }
      
      pdf.save('santa-ceia-marcacao.pdf');
      setShowPdfPreview(false);
    } catch (e) {
      console.error('Erro ao gerar PDF:', e);
      alert('Erro ao gerar PDF. Tente novamente.');
    }
  };

  const gerarExcel = () => {
    if (santaCeias.length === 0) {
      alert('Nenhuma marcação para exportar');
      return;
    }

    // Filtrar dados de 2026 e ordenar por data
    const dadosFiltrados = santaCeias
      .filter(sc => new Date(sc.data).getFullYear() === 2026)
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

    // Preparar dados
    const data = dadosFiltrados.map(sc => ({
      'Data': new Date(sc.data + 'T12:00:00').toLocaleDateString('pt-BR'),
      'Hora': sc.horario || '03:00',
      'Congregação': getCongregacaoNome(sc.congregacaoId || ''),
      'Ancião': reduzirNomes(sc.anciaoAtende)?.split(', ').join(' / ') || '—',
      'Diác. Responsável': reduzirNome(sc.diaconoResponsavel) || '—',
      'Diác. Auxiliares': reduzirNomes(sc.diaconoAuxiliar)?.split(', ').join(' / ') || '—',
      'Contagem': reduzirNome(sc.responsavelContagem) || '—',
    }));

    // Criar workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Ajustar largura das colunas
    ws['!cols'] = [
      { wch: 12 },
      { wch: 10 },
      { wch: 18 },
      { wch: 25 },
      { wch: 18 },
      { wch: 25 },
      { wch: 18 },
    ];

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Santas Ceias');

    // Gerar arquivo
    XLSX.writeFile(wb, 'santa-ceia-marcacao.xlsx');
  };

  // Funções auxiliares para configuração do preview
  const getPaddingClass = () => {
    switch (previewConfig.cellHeight) {
      case 'pequeno': return 'py-1 px-2';
      case 'grande': return 'py-4 px-3';
      default: return 'py-2 px-2.5';
    }
  };

  const getFontSizeClass = () => {
    switch (previewConfig.fontSize) {
      case 'pequeno': return 'text-xs';
      case 'grande': return 'text-base';
      default: return 'text-sm';
    }
  };

  const getFontWeightClass = () => {
    return previewConfig.bold ? 'font-bold' : 'font-medium';
  };

  const reduzirNome = (nome: string) => {
    if (!nome) return '';
    const partes = nome.trim().split(/\s+/);
    if (partes.length <= 1) return nome;
    return `${partes[0]} ${partes[partes.length - 1]}`;
  };

  const reduzirNomes = (nomes: string) => {
    if (!nomes) return nomes;
    return nomes.split(', ').map(n => reduzirNome(n.trim())).join(', ');
  };

  const getSortedSantaCeias = () => {
    const sorted = [...santaCeias].filter(s => {
      const year = new Date(s.data).getFullYear();
      return year === 2026;
    });
    switch (previewConfig.sortBy) {
      case 'congregacao':
        return sorted.sort((a, b) => getCongregacaoNome(a.congregacaoId || '').localeCompare(getCongregacaoNome(b.congregacaoId || ''), 'pt-BR'));
      case 'anciao':
        return sorted.sort((a, b) => (a.anciaoAtende || '').localeCompare(b.anciaoAtende || '', 'pt-BR'));
      default:
        return sorted.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">Santa Ceia - Marcação</h1>
          <p className="text-sm text-muted-foreground mt-1">Marcação e gerenciamento de Santa Ceia</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={abrirPreviewPDF} disabled={santaCeias.length === 0}>
            <FileText className="h-4 w-4" /> PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={gerarExcel} disabled={santaCeias.length === 0}>
            <Download className="h-4 w-4" /> XLS
          </Button>
          <Dialog open={open} onOpenChange={(newOpen) => {
            setOpen(newOpen);
            if (!newOpen) {
              setAnciaosOutraLocalidade([]);
              setDiaconosOutraLocalidade([]);
              setShowOutraLocalidadeAnciao(false);
              setShowOutraLocalidadeDiacono(false);
              setNovoAnciao({ nome: '', localidade: '' });
              setNovoDiacono({ nome: '', localidade: '' });
            }
          }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Nova Santa Ceia
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Agendar Santa Ceia</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold">Congregação</Label>
                <Select value={form.congregacaoId} onValueChange={(v) => setForm({ ...form, congregacaoId: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {congregacoes
                      .sort((a, b) => a.nome.localeCompare(b.nome))
                      .map(c => {
                        const displayName = c.nome.toLowerCase().includes('central')
                          ? `${c.nome} - ${c.cidade}`
                          : c.nome;
                        return (
                          <SelectItem key={c.id} value={c.id}>{displayName}</SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-semibold">Data</Label>
                <Input
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-sm font-semibold">Horário</Label>
                <Input
                  type="time"
                  value={form.horario}
                  onChange={(e) => setForm({ ...form, horario: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-sm font-semibold">Ancião 1</Label>
                <Select value={form.anciaoAtende1} onValueChange={(v) => setForm({ ...form, anciaoAtende1: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um ancião" />
                  </SelectTrigger>
                  <SelectContent>
                    {getMembrosAnciaos().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map(a => (
                      <SelectItem key={a.id} value={a.nome}>{getNomeComLocalidade(a)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-semibold">Ancião 2</Label>
                <Select value={form.anciaoAtende2} onValueChange={(v) => setForm({ ...form, anciaoAtende2: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um ancião (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {getMembrosAnciaos().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map(a => (
                      <SelectItem key={a.id} value={a.nome}>{getNomeComLocalidade(a)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-semibold">Diácono Responsável</Label>
                <Select value={form.diaconoResponsavel} onValueChange={(v) => setForm({ ...form, diaconoResponsavel: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um diácono" />
                  </SelectTrigger>
                  <SelectContent>
                    {getMembrosD().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map(d => (
                      <SelectItem key={d.id} value={d.nome}>{getNomeComLocalidade(d)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-semibold">Diácono Auxiliar 1</Label>
                <Select value={form.diaconoAuxiliar1} onValueChange={(v) => setForm({ ...form, diaconoAuxiliar1: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um diácono" />
                  </SelectTrigger>
                  <SelectContent>
                    {getMembrosD().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map(d => (
                      <SelectItem key={d.id} value={d.nome}>{getNomeComLocalidade(d)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-semibold">Diácono Auxiliar 2</Label>
                <Select value={form.diaconoAuxiliar2} onValueChange={(v) => setForm({ ...form, diaconoAuxiliar2: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um diácono (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {getMembrosD().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map(d => (
                      <SelectItem key={d.id} value={d.nome}>{getNomeComLocalidade(d)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={showOutraLocalidadeAnciao}
                    onCheckedChange={(checked) => setShowOutraLocalidadeAnciao(checked === true)}
                  />
                  <span className="text-sm font-medium">Ancião de outra localidade</span>
                </label>
              </div>
              
              {showOutraLocalidadeAnciao && (
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 bg-muted/30 rounded-lg">
                  <div>
                    <Label className="text-xs sm:text-sm">Nome do Ancião</Label>
                    <Input
                      placeholder="Digite o nome"
                      value={novoAnciao.nome}
                      onChange={(e) => setNovoAnciao({ ...novoAnciao, nome: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm">Localidade</Label>
                    <Input
                      placeholder="Digite a localidade"
                      value={novoAnciao.localidade}
                      onChange={(e) => setNovoAnciao({ ...novoAnciao, localidade: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (novoAnciao.nome && novoAnciao.localidade) {
                          setAnciaosOutraLocalidade([...anciaoOutraLocalidade, novoAnciao]);
                          setNovoAnciao({ nome: '', localidade: '' });
                        }
                      }}
                      className="w-full text-xs sm:text-sm"
                    >
                      + Adicionar Ancião
                    </Button>
                  </div>
                  {anciaoOutraLocalidade.length > 0 && (
                    <div className="col-span-2 space-y-2">
                      {anciaoOutraLocalidade.map((a, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-background rounded border border-border text-sm">
                          <div>
                            <span className="font-medium">{a.nome}</span>
                            <span className="text-xs text-muted-foreground ml-2">({a.localidade})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAnciaosOutraLocalidade(anciaoOutraLocalidade.filter((_, i) => i !== idx))}
                            className="text-destructive hover:text-destructive/80"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={showOutraLocalidadeDiacono}
                    onCheckedChange={(checked) => setShowOutraLocalidadeDiacono(checked === true)}
                  />
                  <span className="text-sm font-medium">Diácono de outra localidade</span>
                </label>
              </div>

              {showOutraLocalidadeDiacono && (
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 bg-muted/30 rounded-lg">
                  <div>
                    <Label className="text-xs sm:text-sm">Nome do Diácono</Label>
                    <Input
                      placeholder="Digite o nome"
                      value={novoDiacono.nome}
                      onChange={(e) => setNovoDiacono({ ...novoDiacono, nome: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm">Localidade</Label>
                    <Input
                      placeholder="Digite a localidade"
                      value={novoDiacono.localidade}
                      onChange={(e) => setNovoDiacono({ ...novoDiacono, localidade: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (novoDiacono.nome && novoDiacono.localidade) {
                          setDiaconosOutraLocalidade([...diaconoOutraLocalidade, novoDiacono]);
                          setNovoDiacono({ nome: '', localidade: '' });
                        }
                      }}
                      className="w-full text-xs sm:text-sm"
                    >
                      + Adicionar Diácono
                    </Button>
                  </div>
                  {diaconoOutraLocalidade.length > 0 && (
                    <div className="col-span-2 space-y-2">
                      {diaconoOutraLocalidade.map((d, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-background rounded border border-border text-sm">
                          <div>
                            <span className="font-medium">{d.nome}</span>
                            <span className="text-xs text-muted-foreground ml-2">({d.localidade})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDiaconosOutraLocalidade(diaconoOutraLocalidade.filter((_, i) => i !== idx))}
                            className="text-destructive hover:text-destructive/80"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="md:col-span-2">
                <Label className="text-sm font-semibold">Responsável pela Contagem</Label>
                <Input
                  type="text"
                  placeholder="Digite o nome do responsável"
                  value={form.responsavelContagem}
                  onChange={(e) => setForm({ ...form, responsavelContagem: e.target.value })}
                />
              </div>

              <div className="md:col-span-2 flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancelar</Button>
                <Button onClick={handleSubmit} className="flex-1">Agendar</Button>
              </div>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Lista de Santa Ceias */}
      {santaCeias.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center border-2 border-dashed border-border">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-lg font-semibold text-muted-foreground">Nenhuma Santa Ceia agendada</p>
        </div>
      ) : (
        <div className="glass-card rounded-xl p-6 border border-border/50">
          <div className="overflow-x-auto" ref={tableRef}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Data</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Congregação</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Anciães</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Diác. Responsável</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Diác. Auxiliares</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Contagem</th>
                  <th className="px-4 py-3 text-center font-semibold text-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {santaCeias.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()).map((sc) => {
                  const dataObj = new Date(sc.data + 'T12:00:00');
                  const dataBR = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                  const diasSemana = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
                  const diaSemana = diasSemana[dataObj.getDay()];
                  return (
                    <tr key={sc.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-foreground">{dataBR} {diaSemana}</td>
                      <td className="px-4 py-3 text-foreground">{getCongregacaoNome(sc.congregacaoId || '')}</td>
                      <td className="px-4 py-3 text-foreground">{sc.anciaoAtende || '—'}</td>
                      <td className="px-4 py-3 text-foreground">{sc.diaconoResponsavel || '—'}</td>
                      <td className="px-4 py-3 text-foreground">{sc.diaconoAuxiliar || '—'}</td>
                      <td className="px-4 py-3 text-foreground">{sc.responsavelContagem || '—'}</td>
                      <td className="px-4 py-3 text-center flex gap-2 justify-center">
                        <button
                          onClick={() => handleViewDetails(sc)}
                          className="text-blue-500 hover:text-blue-600 transition-colors"
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(sc)}
                          className="text-amber-500 hover:text-amber-600 transition-colors"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSantaCeia(sc);
                            setDeleteConfirmOpen(true);
                          }}
                          className="text-destructive hover:text-destructive/80 transition-colors"
                          title="Deletar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dialog de Visualização */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Santa Ceia</DialogTitle>
          </DialogHeader>
          {selectedSantaCeia && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold text-muted-foreground">Data</Label>
                <p className="text-foreground">{new Date(selectedSantaCeia.data + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold text-muted-foreground">Horário</Label>
                <p className="text-foreground">{selectedSantaCeia.horario}</p>
              </div>
              <div className="col-span-2">
                <Label className="text-sm font-semibold text-muted-foreground">Congregação</Label>
                <p className="text-foreground">{getCongregacaoNome(selectedSantaCeia.congregacaoId)}</p>
              </div>
              <div className="col-span-2">
                <Label className="text-sm font-semibold text-muted-foreground">Anciães</Label>
                <p className="text-foreground">{selectedSantaCeia.anciaoAtende || '—'}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold text-muted-foreground">Diácono Responsável</Label>
                <p className="text-foreground">{selectedSantaCeia.diaconoResponsavel || '—'}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold text-muted-foreground">Diáconos Auxiliares</Label>
                <p className="text-foreground">{selectedSantaCeia.diaconoAuxiliar || '—'}</p>
              </div>
              <div className="col-span-2">
                <Label className="text-sm font-semibold text-muted-foreground">Responsável pela Contagem</Label>
                <p className="text-foreground">{selectedSantaCeia.responsavelContagem || '—'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição */}
      <Dialog open={editOpen} onOpenChange={(newOpen) => {
        setEditOpen(newOpen);
        if (!newOpen) {
          setAnciaosOutraLocalidade([]);
          setDiaconosOutraLocalidade([]);
          setShowOutraLocalidadeAnciao(false);
          setShowOutraLocalidadeDiacono(false);
          setNovoAnciao({ nome: '', localidade: '' });
          setNovoDiacono({ nome: '', localidade: '' });
        }
      }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Santa Ceia</DialogTitle>
          </DialogHeader>
          {editingForm && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold">Congregação</Label>
                <Select value={editingForm.congregacaoId} onValueChange={(v) => setEditingForm({ ...editingForm, congregacaoId: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {congregacoes
                      .sort((a, b) => a.nome.localeCompare(b.nome))
                      .map(c => {
                        const displayName = c.nome.toLowerCase().includes('central')
                          ? `${c.nome} - ${c.cidade}`
                          : c.nome;
                        return (
                          <SelectItem key={c.id} value={c.id}>{displayName}</SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-semibold">Data</Label>
                <Input
                  type="date"
                  value={editingForm.data}
                  onChange={(e) => setEditingForm({ ...editingForm, data: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-sm font-semibold">Horário</Label>
                <Input
                  type="time"
                  value={editingForm.horario}
                  onChange={(e) => setEditingForm({ ...editingForm, horario: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-sm font-semibold">Ancião 1</Label>
                <Select value={editingForm.anciaoAtende1} onValueChange={(v) => setEditingForm({ ...editingForm, anciaoAtende1: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um ancião" />
                  </SelectTrigger>
                  <SelectContent>
                    {getMembrosAnciaos().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map(a => (
                      <SelectItem key={a.id} value={a.nome}>{getNomeComLocalidade(a)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-semibold">Ancião 2</Label>
                <Select value={editingForm.anciaoAtende2} onValueChange={(v) => setEditingForm({ ...editingForm, anciaoAtende2: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um ancião (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {getMembrosAnciaos().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map(a => (
                      <SelectItem key={a.id} value={a.nome}>{getNomeComLocalidade(a)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-semibold">Diácono Responsável</Label>
                <Select value={editingForm.diaconoResponsavel} onValueChange={(v) => setEditingForm({ ...editingForm, diaconoResponsavel: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um diácono" />
                  </SelectTrigger>
                  <SelectContent>
                    {getMembrosD().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map(d => (
                      <SelectItem key={d.id} value={d.nome}>{getNomeComLocalidade(d)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-semibold">Diácono Auxiliar 1</Label>
                <Select value={editingForm.diaconoAuxiliar1} onValueChange={(v) => setEditingForm({ ...editingForm, diaconoAuxiliar1: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um diácono" />
                  </SelectTrigger>
                  <SelectContent>
                    {getMembrosD().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map(d => (
                      <SelectItem key={d.id} value={d.nome}>{getNomeComLocalidade(d)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-semibold">Diácono Auxiliar 2</Label>
                <Select value={editingForm.diaconoAuxiliar2} onValueChange={(v) => setEditingForm({ ...editingForm, diaconoAuxiliar2: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um diácono (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {getMembrosD().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map(d => (
                      <SelectItem key={d.id} value={d.nome}>{getNomeComLocalidade(d)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={showOutraLocalidadeAnciao}
                    onCheckedChange={(checked) => setShowOutraLocalidadeAnciao(checked === true)}
                  />
                  <span className="text-sm font-medium">Ancião de outra localidade</span>
                </label>
              </div>
              
              {showOutraLocalidadeAnciao && (
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 bg-muted/30 rounded-lg">
                  <div>
                    <Label className="text-xs sm:text-sm">Nome do Ancião</Label>
                    <Input
                      placeholder="Digite o nome"
                      value={novoAnciao.nome}
                      onChange={(e) => setNovoAnciao({ ...novoAnciao, nome: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm">Localidade</Label>
                    <Input
                      placeholder="Digite a localidade"
                      value={novoAnciao.localidade}
                      onChange={(e) => setNovoAnciao({ ...novoAnciao, localidade: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (novoAnciao.nome && novoAnciao.localidade) {
                          setAnciaosOutraLocalidade([...anciaoOutraLocalidade, novoAnciao]);
                          setNovoAnciao({ nome: '', localidade: '' });
                        }
                      }}
                      className="w-full text-xs sm:text-sm"
                    >
                      + Adicionar Ancião
                    </Button>
                  </div>
                  {anciaoOutraLocalidade.length > 0 && (
                    <div className="col-span-2 space-y-2">
                      {anciaoOutraLocalidade.map((a, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-background rounded border border-border text-sm">
                          <div>
                            <span className="font-medium">{a.nome}</span>
                            <span className="text-xs text-muted-foreground ml-2">({a.localidade})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAnciaosOutraLocalidade(anciaoOutraLocalidade.filter((_, i) => i !== idx))}
                            className="text-destructive hover:text-destructive/80"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={showOutraLocalidadeDiacono}
                    onCheckedChange={(checked) => setShowOutraLocalidadeDiacono(checked === true)}
                  />
                  <span className="text-sm font-medium">Diácono de outra localidade</span>
                </label>
              </div>

              {showOutraLocalidadeDiacono && (
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 bg-muted/30 rounded-lg">
                  <div>
                    <Label className="text-xs sm:text-sm">Nome do Diácono</Label>
                    <Input
                      placeholder="Digite o nome"
                      value={novoDiacono.nome}
                      onChange={(e) => setNovoDiacono({ ...novoDiacono, nome: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm">Localidade</Label>
                    <Input
                      placeholder="Digite a localidade"
                      value={novoDiacono.localidade}
                      onChange={(e) => setNovoDiacono({ ...novoDiacono, localidade: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (novoDiacono.nome && novoDiacono.localidade) {
                          setDiaconosOutraLocalidade([...diaconoOutraLocalidade, novoDiacono]);
                          setNovoDiacono({ nome: '', localidade: '' });
                        }
                      }}
                      className="w-full text-xs sm:text-sm"
                    >
                      + Adicionar Diácono
                    </Button>
                  </div>
                  {diaconoOutraLocalidade.length > 0 && (
                    <div className="col-span-2 space-y-2">
                      {diaconoOutraLocalidade.map((d, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-background rounded border border-border text-sm">
                          <div>
                            <span className="font-medium">{d.nome}</span>
                            <span className="text-xs text-muted-foreground ml-2">({d.localidade})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDiaconosOutraLocalidade(diaconoOutraLocalidade.filter((_, i) => i !== idx))}
                            className="text-destructive hover:text-destructive/80"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="md:col-span-2">
                <Label className="text-sm font-semibold">Responsável pela Contagem</Label>
                <Input
                  type="text"
                  placeholder="Digite o nome do responsável"
                  value={editingForm.responsavelContagem}
                  onChange={(e) => setEditingForm({ ...editingForm, responsavelContagem: e.target.value })}
                />
              </div>

              <div className="md:col-span-2 flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditOpen(false)} className="flex-1">Cancelar</Button>
                <Button onClick={handleSaveEdit} className="flex-1">Salvar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={deleteConfirmOpen} onOpenChange={(newOpen) => !isDeleting && setDeleteConfirmOpen(newOpen)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta Santa Ceia de <strong>{selectedSantaCeia && getCongregacaoNome(selectedSantaCeia.congregacaoId || '')}</strong>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} disabled={isDeleting}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? 'Deletando...' : 'Deletar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Preview PDF */}
      <Dialog open={showPdfPreview} onOpenChange={setShowPdfPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader className="flex items-center justify-between">
            <DialogTitle>Preview - Santa Ceia</DialogTitle>
            <Button variant="ghost" size="sm" onClick={() => setConfigOpen(true)} className="h-8 w-8 p-0">
              <Settings className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <div ref={pdfPreviewRef} className="bg-white p-6">
            <div className="mb-8 pb-6 border-b-4 border-gray-900">
              <h1 className="text-2xl font-bold text-center mb-0">CONGREGAÇÃO CRISTÃ NO BRASIL</h1>
              <h1 className="text-xl font-bold text-center mb-3">SANTAS-CEIAS 2026 - Administração ITUIUTABA</h1>
              <p className="text-center text-gray-700 text-sm font-bold">{new Date().toLocaleDateString('pt-BR')}</p>
            </div>
            
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-gray-300 border-3 border-gray-900">
                  <th className={`border-2 border-gray-900 text-left font-bold text-gray-900 ${getPaddingClass()} ${getFontSizeClass()}`}>Data</th>
                  <th className={`border-2 border-gray-900 text-left font-bold text-gray-900 ${getPaddingClass()} ${getFontSizeClass()}`}>Hora</th>
                  <th className={`border-2 border-gray-900 text-left font-bold text-gray-900 ${getPaddingClass()} ${getFontSizeClass()}`}>Congregação</th>
                  <th className={`border-2 border-gray-900 text-left font-bold text-gray-900 ${getPaddingClass()} ${getFontSizeClass()}`}>Ancião</th>
                  <th className={`border-2 border-gray-900 text-left font-bold text-gray-900 ${getPaddingClass()} ${getFontSizeClass()}`}>Diác. Resp.</th>
                  <th className={`border-2 border-gray-900 text-left font-bold text-gray-900 ${getPaddingClass()} ${getFontSizeClass()}`}>Diác. Aux.</th>
                  <th className={`border-2 border-gray-900 text-left font-bold text-gray-900 ${getPaddingClass()} ${getFontSizeClass()}`}>Contagem</th>
                </tr>
              </thead>
              <tbody>
                {getSortedSantaCeias().length === 0 ? (
                  <tr>
                    <td colSpan={7} className={`border-2 border-gray-900 text-center text-gray-600 font-semibold ${getPaddingClass()} ${getFontSizeClass()}`}>
                      Nenhuma marcação registrada
                    </td>
                  </tr>
                ) : (
                  getSortedSantaCeias().map((santa, idx) => (
                    <tr key={santa.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className={`border-2 border-gray-900 ${getPaddingClass()} ${getFontSizeClass()} ${getFontWeightClass()}`}>
                        {new Date(santa.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </td>
                      <td className={`border-2 border-gray-900 ${getPaddingClass()} ${getFontSizeClass()} ${getFontWeightClass()}`}>{santa.horario || '03:00'}</td>
                      <td className={`border-2 border-gray-900 ${getPaddingClass()} ${getFontSizeClass()} ${getFontWeightClass()}`}>{getCongregacaoNome(santa.congregacaoId || '')}</td>
                      <td className={`border-2 border-gray-900 ${getPaddingClass()} ${getFontSizeClass()}`}>
                        {reduzirNomes(santa.anciaoAtende)?.split(', ').join('\n') || '—'}
                      </td>
                      <td className={`border-2 border-gray-900 ${getPaddingClass()} ${getFontSizeClass()} ${getFontWeightClass()}`}>{reduzirNome(santa.diaconoResponsavel) || '—'}</td>
                      <td className={`border-2 border-gray-900 ${getPaddingClass()} ${getFontSizeClass()}`}>
                        {reduzirNomes(santa.diaconoAuxiliar)?.split(', ').join('\n') || '—'}
                      </td>
                      <td className={`border-2 border-gray-900 ${getPaddingClass()} ${getFontSizeClass()} ${getFontWeightClass()}`}>{reduzirNome(santa.responsavelContagem) || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setShowPdfPreview(false)}>Cancelar</Button>
            <Button onClick={gerarPDFFinal}>Gerar PDF</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Configuração do Preview */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configurações do Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold">Ordem dos Eventos</Label>
              <Select value={previewConfig.sortBy} onValueChange={(value) => setPreviewConfig({...previewConfig, sortBy: value as 'data' | 'congregacao' | 'anciao'})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="data">Por Data</SelectItem>
                  <SelectItem value="congregacao">Por Congregação</SelectItem>
                  <SelectItem value="anciao">Por Ancião</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-semibold">Altura das Células</Label>
              <Select value={previewConfig.cellHeight} onValueChange={(value) => setPreviewConfig({...previewConfig, cellHeight: value as 'pequeno' | 'normal' | 'grande'})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pequeno">Pequena</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="grande">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-semibold">Tamanho da Fonte</Label>
              <Select value={previewConfig.fontSize} onValueChange={(value) => setPreviewConfig({...previewConfig, fontSize: value as 'pequeno' | 'normal' | 'grande'})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pequeno">Pequeno</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="grande">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="bold-check"
                checked={previewConfig.bold}
                onCheckedChange={(checked) => setPreviewConfig({...previewConfig, bold: checked === true})}
              />
              <Label htmlFor="bold-check" className="text-sm font-medium cursor-pointer">Negrito</Label>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setConfigOpen(false)}>Fechar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
