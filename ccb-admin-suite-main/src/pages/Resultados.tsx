import { useState, useRef, useMemo } from 'react';
import { Plus, Trash2, Edit2, Download, Upload, FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).href;
import { useResultadosBatismo, useResultadosSantaCeia, useResultadosEnsaioRegional, useCongregacoes, useEventos, useEnsaios } from '@/hooks/useData';
import { ResultadoBatismo, ResultadoSantaCeia, ResultadoEnsaioRegional } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Resultados() {
  const { resultados: batismos, adicionar: adicionarBatismo, remover: removerBatismo, atualizar: atualizarBatismo } = useResultadosBatismo();
  const { resultados: santaceias, adicionar: adicionarSantaCeia, remover: removerSantaCeia, atualizar: atualizarSantaCeia } = useResultadosSantaCeia();
  const { resultados: resultadosEnsaio, adicionar: adicionarEnsaio, remover: removerEnsaio, atualizar: atualizarEnsaio } = useResultadosEnsaioRegional();
  const { congregacoes } = useCongregacoes();

  const [activeTab, setActiveTab] = useState('batismo');

  // Estados para Batismo
  const [openBatismo, setOpenBatismo] = useState(false);
  const [formBatismo, setFormBatismo] = useState({ data: '', congregacaoId: '', irmaos: 0, irmas: 0, anciaoNome: '', anciaoLocalidade: '', observacoes: '' });
  const [editingBatismo, setEditingBatismo] = useState<string | null>(null);

  // Estados para Santa Ceia
  const [openSantaCeia, setOpenSantaCeia] = useState(false);
  const [formSantaCeia, setFormSantaCeia] = useState({ data: '', congregacaoId: '', irmaos: 0, irmas: 0, anciaoNome: '', anciaoLocalidade: '', diaconoNome: '', observacoes: '' });
  const [editingSantaCeia, setEditingSantaCeia] = useState<string | null>(null);

  // Estados para Ensaio Regional
  const [openEnsaio, setOpenEnsaio] = useState(false);
  interface Musico {
    id: string;
    nome: string;
    instrumento: string;
    localidade: string;
  }

  const [formEnsaio, setFormEnsaio] = useState({ data: '', titulo: '', local: '', musicos: [] as Musico[], organistas: 0, observacoes: '' });
  const [editingEnsaio, setEditingEnsaio] = useState<string | null>(null);
  const [novoMusico, setNovoMusico] = useState({ nome: '', instrumento: '', localidade: '' });

  // Filter states
  const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const [filterBatYear, setFilterBatYear] = useState('all');
  const [filterBatMonth, setFilterBatMonth] = useState('all');
  const [filterBatCity, setFilterBatCity] = useState('all');
  const [filterBatCong, setFilterBatCong] = useState('all');

  const [filterScYear, setFilterScYear] = useState('all');
  const [filterScMonth, setFilterScMonth] = useState('all');
  const [filterScCity, setFilterScCity] = useState('all');
  const [filterScCong, setFilterScCong] = useState('all');

  const [filterEnsaioYear, setFilterEnsaioYear] = useState('all');
  const [filterEnsaioMonth, setFilterEnsaioMonth] = useState('all');

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'batismo' | 'santaceia' | 'ensaio'; label: string } | null>(null);

  const getCongregacaoNome = (id: string) => {
    const cong = congregacoes.find((c) => c.id === id);
    return cong?.nome || '—';
  };

  const getCongregacaoCidade = (id: string) => {
    const cong = congregacoes.find((c) => c.id === id);
    return cong?.cidade || '';
  };

  const reduzirNome = (nome: string) => {
    if (!nome) return '—';
    const partes = nome.split(' ');
    return partes.length > 1 ? partes[0] + ' ' + partes[partes.length - 1] : nome;
  };

  // Refs para input de arquivo
  const uploadBatismoRef = useRef<HTMLInputElement>(null);
  const uploadSantaCeiaRef = useRef<HTMLInputElement>(null);
  const uploadBatismoPDFRef = useRef<HTMLInputElement>(null);
  const uploadSantaCeiaPDFRef = useRef<HTMLInputElement>(null);

  // Baixar template XLS
  const baixarTemplateBatismo = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Data (AAAA-MM-DD)', 'Congregação', 'Irmãos', 'Irmãs', 'Ancião', 'Localidade Ancião', 'Observações'],
      ['2026-01-01', 'Nome da Congregação', 0, 0, 'Nome do Ancião', 'Cidade', ''],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Batismos');
    XLSX.writeFile(wb, 'template_batismos.xlsx');
  };

  const baixarTemplateSantaCeia = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Data (AAAA-MM-DD)', 'Congregação', 'Irmãos', 'Irmãs', 'Ancião', 'Localidade Ancião', 'Observações'],
      ['2026-01-01', 'Nome da Congregação', 0, 0, 'Nome do Ancião', 'Cidade', ''],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SantaCeia');
    XLSX.writeFile(wb, 'template_santa_ceia.xlsx');
  };

  // Parser de data Excel (número serial, Date JS ou string)
  const parsearData = (val: unknown): string => {
    if (!val) return '';
    if (val instanceof Date) {
      const y = val.getFullYear();
      const m = String(val.getMonth() + 1).padStart(2, '0');
      const d = String(val.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    if (typeof val === 'number') {
      // Fórmula de conversão serial do Excel para data
      const epoch = new Date(Date.UTC(1899, 11, 30));
      const d = new Date(epoch.getTime() + val * 86400000);
      const y = d.getUTCFullYear();
      const mo = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${y}-${mo}-${day}`;
    }
    const s = String(val).trim();
    // aceita DD/MM/AAAA ou AAAA-MM-DD
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
      const [d, m, y] = s.split('/');
      return `${y}-${m}-${d}`;
    }
    return s;
  };

  // Normaliza chave de coluna para comparação flexível
  const normCol = (key: string) =>
    key.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  // Busca valor em row por múltiplos nomes de coluna (case-insensitive, sem acentos)
  const getCol = (row: Record<string, unknown>, ...names: string[]): unknown => {
    const keys = Object.keys(row);
    for (const name of names) {
      const target = normCol(name);
      const found = keys.find(k => normCol(k) === target || normCol(k).includes(target) || target.includes(normCol(k)));
      if (found !== undefined && row[found] !== '' && row[found] !== undefined) return row[found];
    }
    return '';
  };

  // Encontrar congregação pelo nome (case-insensitive, parcial)
  const encontrarCongregacao = (nome: string): string => {
    if (!nome) return '';
    const lower = nome.toLowerCase().trim();
    const match = congregacoes.find((c) => c.nome.toLowerCase().includes(lower) || lower.includes(c.nome.toLowerCase()));
    return match?.id || '';
  };

  // Upload XLS Batismo
  const handleUploadBatismo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = await file.arrayBuffer();
    const wb = XLSX.read(new Uint8Array(data), { type: 'array', cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
    let importados = 0;
    for (const row of rows) {
      const dataVal = parsearData(getCol(row, 'Data (AAAA-MM-DD)', 'Data', 'data', 'DATE'));
      const congregNome = String(getCol(row, 'Congregação', 'Congregacao', 'congregacao', 'Congregação') || '');
      const irmaos = Number(getCol(row, 'Irmãos', 'Irmaos', 'irmaos', 'Irmãos') || 0);
      const irmas = Number(getCol(row, 'Irmãs', 'Irmas', 'irmas', 'Irmãs') || 0);
      const anciaoNome = String(getCol(row, 'Ancião', 'Anciao', 'anciao', 'Ancião') || '');
      const anciaoLocalidade = String(getCol(row, 'Localidade Ancião', 'Localidade', 'localidade') || '');
      const observacoes = String(getCol(row, 'Observações', 'Observacoes', 'observacoes') || '');
      if (!dataVal) continue;
      const congregacaoId = encontrarCongregacao(congregNome);
      await adicionarBatismo({ data: dataVal, congregacaoId, irmaos, irmas, anciaoNome, anciaoLocalidade, observacoes });
      importados++;
    }
    e.target.value = '';
    if (importados > 0) alert(`${importados} resultado(s) de batismo importado(s) com sucesso!`);
    else alert('Nenhum dado válido encontrado no arquivo. Verifique se o arquivo segue o template.');
  };

  // Upload XLS Santa Ceia
  const handleUploadSantaCeia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = await file.arrayBuffer();
    const wb = XLSX.read(new Uint8Array(data), { type: 'array', cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
    let importados = 0;
    for (const row of rows) {
      const dataVal = parsearData(getCol(row, 'Data (AAAA-MM-DD)', 'Data', 'data', 'DATE'));
      const congregNome = String(getCol(row, 'Congregação', 'Congregacao', 'congregacao', 'Congregação') || '');
      const irmaos = Number(getCol(row, 'Irmãos', 'Irmaos', 'irmaos', 'Irmãos') || 0);
      const irmas = Number(getCol(row, 'Irmãs', 'Irmas', 'irmas', 'Irmãs') || 0);
      const anciaoNome = String(getCol(row, 'Ancião', 'Anciao', 'anciao', 'Ancião') || '');
      const anciaoLocalidade = String(getCol(row, 'Localidade Ancião', 'Localidade', 'localidade') || '');
      const observacoes = String(getCol(row, 'Observações', 'Observacoes', 'observacoes') || '');
      if (!dataVal) continue;
      const congregacaoId = encontrarCongregacao(congregNome);
      await adicionarSantaCeia({ data: dataVal, congregacaoId, irmaos, irmas, anciaoNome, anciaoLocalidade, diaconoNome: '', observacoes });
      importados++;
    }
    e.target.value = '';
    if (importados > 0) alert(`${importados} resultado(s) de Santa Ceia importado(s) com sucesso!`);
    else alert('Nenhum dado válido encontrado no arquivo. Verifique se o arquivo segue o template.');
  };

  // Extrai texto de um PDF e tenta parsear linhas de dados
  const extrairLinhasDePDF = async (file: File): Promise<Array<{data:string;congregNome:string;irmaos:number;irmas:number;anciao:string}>> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    let texto = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      texto += content.items.map((item) => ('str' in item ? item.str : '')).join(' ') + '\n';
    }
    const linhas = texto.split(/\n|;/).map(l => l.trim()).filter(Boolean);
    const resultados: Array<{data:string;congregNome:string;irmaos:number;irmas:number;anciao:string}> = [];
    const datePattern = /(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})/;
    for (const linha of linhas) {
      const dateMatch = linha.match(datePattern);
      if (!dateMatch) continue;
      const dataStr = parsearData(dateMatch[1]);
      const nums = linha.match(/\d+/g)?.map(Number) || [];
      const bigNums = nums.filter(n => n > 31 ? false : n >= 0);
      // Tenta encontrar nome de congregação
      let congregNome = '';
      for (const c of congregacoes) {
        if (linha.toLowerCase().includes(c.nome.toLowerCase())) {
          congregNome = c.nome;
          break;
        }
      }
      if (dataStr && bigNums.length >= 2) {
        resultados.push({ data: dataStr, congregNome, irmaos: bigNums[bigNums.length-2] || 0, irmas: bigNums[bigNums.length-1] || 0, anciao: '' });
      }
    }
    return resultados;
  };

  // Upload PDF Batismo
  const handleUploadBatismoPDF = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const linhas = await extrairLinhasDePDF(file);
      let importados = 0;
      for (const l of linhas) {
        const congregacaoId = encontrarCongregacao(l.congregNome);
        await adicionarBatismo({ data: l.data, congregacaoId, irmaos: l.irmaos, irmas: l.irmas, anciaoNome: l.anciao, anciaoLocalidade: '', observacoes: '' });
        importados++;
      }
      e.target.value = '';
      if (importados > 0) alert(`${importados} linha(s) de batismo importada(s) do PDF. Verifique os dados cadastrados.`);
      else alert('Não foi possível extrair dados estruturados do PDF. Use o template XLS para importação mais confiável.');
    } catch {
      e.target.value = '';
      alert('Erro ao ler o PDF. Certifique-se de que o arquivo não é uma imagem escaneada.');
    }
  };

  // Upload PDF Santa Ceia
  const handleUploadSantaCeiaPDF = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const linhas = await extrairLinhasDePDF(file);
      let importados = 0;
      for (const l of linhas) {
        const congregacaoId = encontrarCongregacao(l.congregNome);
        await adicionarSantaCeia({ data: l.data, congregacaoId, irmaos: l.irmaos, irmas: l.irmas, anciaoNome: l.anciao, anciaoLocalidade: '', diaconoNome: '', observacoes: '' });
        importados++;
      }
      e.target.value = '';
      if (importados > 0) alert(`${importados} linha(s) de Santa Ceia importada(s) do PDF. Verifique os dados cadastrados.`);
      else alert('Não foi possível extrair dados estruturados do PDF. Use o template XLS para importação mais confiável.');
    } catch {
      e.target.value = '';
      alert('Erro ao ler o PDF. Certifique-se de que o arquivo não é uma imagem escaneada.');
    }
  };
  const handleSubmitBatismo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBatismo.data || !formBatismo.congregacaoId) return;

    const payload = {
      ...formBatismo,
      irmaos: Number(formBatismo.irmaos),
      irmas: Number(formBatismo.irmas),
    };

    if (editingBatismo) {
      const { ...dados } = payload as ResultadoBatismo;
      await atualizarBatismo(editingBatismo, dados);
    } else {
      await adicionarBatismo(payload as ResultadoBatismo);
    }

    setFormBatismo({ data: '', congregacaoId: '', irmaos: 0, irmas: 0, anciaoNome: '', anciaoLocalidade: '', observacoes: '' });
    setEditingBatismo(null);
    setOpenBatismo(false);
  };

  // Handlers Santa Ceia
  const handleSubmitSantaCeia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSantaCeia.data || !formSantaCeia.congregacaoId) return;

    const payload = {
      ...formSantaCeia,
      irmaos: Number(formSantaCeia.irmaos),
      irmas: Number(formSantaCeia.irmas),
    };

    if (editingSantaCeia) {
      const { ...dados } = payload as ResultadoSantaCeia;
      await atualizarSantaCeia(editingSantaCeia, dados);
    } else {
      await adicionarSantaCeia(payload as ResultadoSantaCeia);
    }

    setFormSantaCeia({ data: '', congregacaoId: '', irmaos: 0, irmas: 0, anciaoNome: '', anciaoLocalidade: '', diaconoNome: '', observacoes: '' });
    setEditingSantaCeia(null);
    setOpenSantaCeia(false);
  };

  // Handlers Ensaio Regional
  const handleSubmitEnsaio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEnsaio.data || !formEnsaio.titulo || !formEnsaio.local) return;

    const payload = {
      ...formEnsaio,
      organistas: Number(formEnsaio.organistas),
    };

    if (editingEnsaio) {
      const { ...dados } = payload as ResultadoEnsaioRegional;
      await atualizarEnsaio(editingEnsaio, dados);
    } else {
      await adicionarEnsaio(payload as ResultadoEnsaioRegional);
    }

    setFormEnsaio({ data: '', titulo: '', local: '', musicos: [], organistas: 0, observacoes: '' });
    setEditingEnsaio(null);
    setOpenEnsaio(false);
  };

  const adicionarMusico = () => {
    if (!novoMusico.nome || !novoMusico.instrumento) return;
    setFormEnsaio({
      ...formEnsaio,
      musicos: [
        ...formEnsaio.musicos,
        { id: `musico_${Date.now()}`, ...novoMusico },
      ],
    });
    setNovoMusico({ nome: '', instrumento: '', localidade: '' });
  };

  const removerMusico = (id: string) => {
    setFormEnsaio({
      ...formEnsaio,
      musicos: formEnsaio.musicos.filter((m: Musico) => m.id !== id),
    });
  };

  // Hooks para importação de eventos
  const { eventos } = useEventos();
  const { ensaios } = useEnsaios();

  // Estados para diálogos de importação
  const [openImportarBatismo, setOpenImportarBatismo] = useState(false);
  const [openImportarSantaCeia, setOpenImportarSantaCeia] = useState(false);
  const [openImportarEnsaio, setOpenImportarEnsaio] = useState(false);

  // Função para filtrar eventos por subtipoReuniao
  const eventosComSubtipo = (subtipo: string) =>
    [...eventos]
      .filter((e) => e.subtipoReuniao === subtipo)
      .sort((a, b) => b.data.localeCompare(a.data));

  // Ensaios regionais: da coleção ensaios + eventos com subtipoReuniao 'Ensaio Regional'
  const ensaiosRegionais = [
    ...ensaios.filter((e) => e.nivel === 'Regional'),
    ...eventos.filter((e) => e.subtipoReuniao === 'Ensaio Regional'),
  ].sort((a, b) => (b.data || '').localeCompare(a.data || ''));

  // Handlers para importação
  const importarBatismo = (eventId: string) => {
    const evento = eventosComSubtipo('Batismo').find((e) => e.id === eventId);
    if (evento) {
      setFormBatismo({
        data: evento.data || '',
        congregacaoId: evento.congregacaoId || '',
        irmaos: 0,
        irmas: 0,
        anciaoNome: evento.anciaoAtende || '',
        anciaoLocalidade: evento.anciaoLocalidade || '',
        observacoes: '',
      });
      setOpenImportarBatismo(false);
      setOpenBatismo(true);
    }
  };

  const importarSantaCeia = (eventId: string) => {
    const evento = eventosComSubtipo('Santa-Ceia').find((e) => e.id === eventId);
    if (evento) {
      setFormSantaCeia({
        data: evento.data || '',
        congregacaoId: evento.congregacaoId || '',
        irmaos: 0,
        irmas: 0,
        anciaoNome: evento.anciaoAtende || '',
        anciaoLocalidade: evento.anciaoLocalidade || '',
        diaconoNome: evento.diaconoResponsavel || '',
        observacoes: '',
      });
      setOpenImportarSantaCeia(false);
      setOpenSantaCeia(true);
    }
  };

  const importarEnsaio = (id: string) => {
    // Procura primeiro nos eventos com subtipoReuniao 'Ensaio Regional'
    const eventoEnsaio = eventos.find((e) => e.id === id && e.subtipoReuniao === 'Ensaio Regional');
    if (eventoEnsaio) {
      setFormEnsaio({
        data: eventoEnsaio.data || '',
        titulo: eventoEnsaio.titulo || '',
        local: '',
        musicos: [],
        organistas: 0,
        observacoes: '',
      });
      setOpenImportarEnsaio(false);
      setOpenEnsaio(true);
      return;
    }
    // Procura na coleção de ensaios
    const ensaio = ensaios.find((e) => e.id === id);
    if (ensaio) {
      setFormEnsaio({
        data: ensaio.data || '',
        titulo: ensaio.titulo || '',
        local: ensaio.local || '',
        musicos: [],
        organistas: 0,
        observacoes: '',
      });
      setOpenImportarEnsaio(false);
      setOpenEnsaio(true);
    }
  };

  // Available filter options
  const batYears = useMemo(() => [...new Set(batismos.map(r => r.data.slice(0,4)))].sort((a,b) => b.localeCompare(a)), [batismos]);
  const scYears = useMemo(() => [...new Set(santaceias.map(r => r.data.slice(0,4)))].sort((a,b) => b.localeCompare(a)), [santaceias]);
  const ensaioYears = useMemo(() => [...new Set(resultadosEnsaio.map(r => r.data.slice(0,4)))].sort((a,b) => b.localeCompare(a)), [resultadosEnsaio]);

  const batCities = useMemo(() => {
    const cities = new Set<string>();
    batismos.forEach(r => {
      const cong = congregacoes.find(c => c.id === r.congregacaoId);
      if (cong?.cidade) cities.add(cong.cidade);
    });
    return [...cities].sort();
  }, [batismos, congregacoes]);

  const scCities = useMemo(() => {
    const cities = new Set<string>();
    santaceias.forEach(r => {
      const cong = congregacoes.find(c => c.id === r.congregacaoId);
      if (cong?.cidade) cities.add(cong.cidade);
    });
    return [...cities].sort();
  }, [santaceias, congregacoes]);

  const batCongsForCity = useMemo(() => congregacoes.filter(c => filterBatCity === 'all' || c.cidade === filterBatCity), [congregacoes, filterBatCity]);
  const scCongsForCity = useMemo(() => congregacoes.filter(c => filterScCity === 'all' || c.cidade === filterScCity), [congregacoes, filterScCity]);

  // Filtered results
  const filteredBatismos = useMemo(() => [...batismos]
    .filter(r => r.data && r.data.length >= 7)
    .filter(r => filterBatYear === 'all' || r.data.slice(0,4) === filterBatYear)
    .filter(r => filterBatMonth === 'all' || String(parseInt(r.data.slice(5,7)) - 1) === filterBatMonth)
    .filter(r => {
      if (filterBatCong !== 'all') return r.congregacaoId === filterBatCong;
      if (filterBatCity !== 'all') {
        const cong = congregacoes.find(c => c.id === r.congregacaoId);
        return cong?.cidade === filterBatCity;
      }
      return true;
    })
    .sort((a,b) => b.data.localeCompare(a.data)), [batismos, filterBatYear, filterBatMonth, filterBatCity, filterBatCong, congregacoes]);

  const filteredSantaceias = useMemo(() => [...santaceias]
    .filter(r => r.data && r.data.length >= 7)
    .filter(r => filterScYear === 'all' || r.data.slice(0,4) === filterScYear)
    .filter(r => filterScMonth === 'all' || String(parseInt(r.data.slice(5,7)) - 1) === filterScMonth)
    .filter(r => {
      if (filterScCong !== 'all') return r.congregacaoId === filterScCong;
      if (filterScCity !== 'all') {
        const cong = congregacoes.find(c => c.id === r.congregacaoId);
        return cong?.cidade === filterScCity;
      }
      return true;
    })
    .sort((a,b) => b.data.localeCompare(a.data)), [santaceias, filterScYear, filterScMonth, filterScCity, filterScCong, congregacoes]);

  const filteredEnsaios = useMemo(() => [...resultadosEnsaio]
    .filter(r => r.data && r.data.length >= 7)
    .filter(r => filterEnsaioYear === 'all' || r.data.slice(0,4) === filterEnsaioYear)
    .filter(r => filterEnsaioMonth === 'all' || String(parseInt(r.data.slice(5,7)) - 1) === filterEnsaioMonth)
    .sort((a,b) => b.data.localeCompare(a.data)), [resultadosEnsaio, filterEnsaioYear, filterEnsaioMonth]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Resultados</h1>
        <p className="text-sm text-muted-foreground mt-1">Registro de resultados de eventos</p>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>Tem certeza que deseja excluir {deleteTarget?.label}? Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={async () => {
              if (!deleteTarget) return;
              if (deleteTarget.type === 'batismo') await removerBatismo(deleteTarget.id);
              else if (deleteTarget.type === 'santaceia') await removerSantaCeia(deleteTarget.id);
              else if (deleteTarget.type === 'ensaio') await removerEnsaio(deleteTarget.id);
              setDeleteTarget(null);
            }}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="batismo">Batismo</TabsTrigger>
          <TabsTrigger value="santaceia">Santa Ceia</TabsTrigger>
          <TabsTrigger value="ensaio">Ensaios Regionais</TabsTrigger>
        </TabsList>

        {/* TAB: Batismo */}
        <TabsContent value="batismo" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Resultados de Batismo</h2>
            <div className="flex gap-2">
              <Dialog open={openImportarBatismo} onOpenChange={setOpenImportarBatismo}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Importar Evento
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[60vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Importar Batismo</DialogTitle>
                    <DialogDescription>Selecione um batismo salvo para carregar os dados automaticamente</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2">
                    {eventosComSubtipo('Batismo').map((evento) => (
                      <button
                        key={evento.id}
                        onClick={() => importarBatismo(evento.id)}
                        className="w-full p-4 text-left border rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="font-semibold">{getCongregacaoNome(evento.congregacaoId || '')}</div>
                        <div className="text-sm text-muted-foreground">{new Date(evento.data + 'T12:00:00').toLocaleDateString('pt-BR')}</div>
                        {evento.anciaoAtende && <div className="text-xs text-muted-foreground mt-1">Ancião: {reduzirNome(evento.anciaoAtende)}</div>}
                      </button>
                    ))}
                    {eventosComSubtipo('Batismo').length === 0 && (
                      <div className="text-center text-muted-foreground py-4">Nenhum batismo cadastrado na Agenda</div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              {/* Upload XLS Batismo */}
              <input ref={uploadBatismoRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleUploadBatismo} />
              <input ref={uploadBatismoPDFRef} type="file" accept=".pdf" className="hidden" onChange={handleUploadBatismoPDF} />
              <Button variant="outline" className="gap-2" onClick={baixarTemplateBatismo} title="Baixar template XLS">
                <FileSpreadsheet className="h-4 w-4" />
                Template
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => uploadBatismoRef.current?.click()}>
                <Upload className="h-4 w-4" />
                Upload XLS
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => uploadBatismoPDFRef.current?.click()}>
                <FileText className="h-4 w-4" />
                Upload PDF
              </Button>
              <Dialog open={openBatismo} onOpenChange={setOpenBatismo}>
                <DialogTrigger asChild>
                  <Button
                    className="gap-2"
                    onClick={() => {
                      setFormBatismo({ data: '', congregacaoId: '', irmaos: 0, irmas: 0, anciaoNome: '', anciaoLocalidade: '', observacoes: '' });
                      setEditingBatismo(null);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Novo Resultado
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingBatismo ? 'Editar Batismo' : 'Novo Batismo'}</DialogTitle>
                  <DialogDescription>{editingBatismo ? 'Atualize os dados do batismo' : 'Registre um novo batismo'}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitBatismo} className="space-y-4">
                  <div>
                    <Label>Data</Label>
                    <Input type="date" value={formBatismo.data} onChange={(e) => setFormBatismo({ ...formBatismo, data: e.target.value })} />
                  </div>
                  <div>
                    <Label>Congregação</Label>
                    <Select value={formBatismo.congregacaoId} onValueChange={(v) => setFormBatismo({ ...formBatismo, congregacaoId: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {congregacoes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.nome} {c.cidade ? `— ${c.cidade}` : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Ancião que Atende</Label>
                      <Input value={formBatismo.anciaoNome} onChange={(e) => setFormBatismo({ ...formBatismo, anciaoNome: e.target.value })} placeholder="Nome do ancião" />
                    </div>
                    <div>
                      <Label>Localidade do Ancião</Label>
                      <Input value={formBatismo.anciaoLocalidade} onChange={(e) => setFormBatismo({ ...formBatismo, anciaoLocalidade: e.target.value })} placeholder="Localidade" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Irmãos</Label>
                      <Input type="number" min="0" value={formBatismo.irmaos} onChange={(e) => setFormBatismo({ ...formBatismo, irmaos: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div>
                      <Label>Irmãs</Label>
                      <Input type="number" min="0" value={formBatismo.irmas} onChange={(e) => setFormBatismo({ ...formBatismo, irmas: parseInt(e.target.value) || 0 })} />
                    </div>
                  </div>
                  <div>
                    <Label>Observações</Label>
                    <Input value={formBatismo.observacoes} onChange={(e) => setFormBatismo({ ...formBatismo, observacoes: e.target.value })} placeholder="Opcional" />
                  </div>
                  <Button type="submit" className="w-full">Salvar</Button>
                </form>
              </DialogContent>
            </Dialog>
            </div>
          </div>

          <div className="grid gap-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-2 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Ano</label>
                <Select value={filterBatYear} onValueChange={setFilterBatYear}>
                  <SelectTrigger className="w-28"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {batYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Mês</label>
                <Select value={filterBatMonth} onValueChange={setFilterBatMonth}>
                  <SelectTrigger className="w-32"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {MONTH_NAMES.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Cidade</label>
                <Select value={filterBatCity} onValueChange={(v) => { setFilterBatCity(v); setFilterBatCong('all'); }}>
                  <SelectTrigger className="w-36"><SelectValue placeholder="Todas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {batCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Congregação</label>
                <Select value={filterBatCong} onValueChange={setFilterBatCong}>
                  <SelectTrigger className="w-44"><SelectValue placeholder="Todas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {batCongsForCity.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {(filterBatYear !== 'all' || filterBatMonth !== 'all' || filterBatCity !== 'all' || filterBatCong !== 'all') && (
                <button onClick={() => { setFilterBatYear('all'); setFilterBatMonth('all'); setFilterBatCity('all'); setFilterBatCong('all'); }}
                  className="text-xs text-muted-foreground underline self-end pb-2">Limpar filtros</button>
              )}
              <span className="self-end pb-2 text-xs text-muted-foreground">{filteredBatismos.length} resultado(s)</span>
            </div>

            {filteredBatismos.map((batismo) => (
              <Card key={batismo.id} className="border-border">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground">{getCongregacaoNome(batismo.congregacaoId)}</p>
                        {getCongregacaoCidade(batismo.congregacaoId) && (
                          <span className="text-sm text-muted-foreground">— {getCongregacaoCidade(batismo.congregacaoId)}</span>
                        )}
                        <Badge variant="outline">{new Date(batismo.data + 'T12:00:00').toLocaleDateString('pt-BR')}</Badge>
                      </div>
                      {batismo.anciaoNome && (
                        <p className="text-sm text-muted-foreground">
                          Ancião: <span className="font-medium text-foreground">{batismo.anciaoNome}</span>
                          {batismo.anciaoLocalidade && <span className="text-muted-foreground"> — {batismo.anciaoLocalidade}</span>}
                        </p>
                      )}
                      <div className="grid grid-cols-3 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Irmãos</p>
                          <p className="text-lg font-bold text-primary">{batismo.irmaos}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Irmãs</p>
                          <p className="text-lg font-bold text-blue-600">{batismo.irmas}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="text-lg font-bold text-foreground">{Number(batismo.irmaos) + Number(batismo.irmas)}</p>
                        </div>
                      </div>
                      {batismo.observacoes && <p className="text-sm text-muted-foreground mt-2">{batismo.observacoes}</p>}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFormBatismo({ ...batismo, anciaoNome: batismo.anciaoNome || '', anciaoLocalidade: batismo.anciaoLocalidade || '', observacoes: batismo.observacoes || '' });
                          setEditingBatismo(batismo.id);
                          setOpenBatismo(true);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeleteTarget({ id: batismo.id, type: 'batismo', label: `o batismo de ${getCongregacaoNome(batismo.congregacaoId)}` })}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB: Santa Ceia */}
        <TabsContent value="santaceia" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Resultados de Santa Ceia</h2>
            <div className="flex gap-2">
              <Dialog open={openImportarSantaCeia} onOpenChange={setOpenImportarSantaCeia}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Importar Evento
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[60vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Importar Santa Ceia</DialogTitle>
                    <DialogDescription>Selecione uma Santa Ceia salva para carregar os dados automaticamente</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2">
                    {eventosComSubtipo('Santa-Ceia').map((evento) => (
                      <button
                        key={evento.id}
                        onClick={() => importarSantaCeia(evento.id)}
                        className="w-full p-4 text-left border rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="font-semibold">{getCongregacaoNome(evento.congregacaoId || '')}</div>
                        <div className="text-sm text-muted-foreground">{new Date(evento.data + 'T12:00:00').toLocaleDateString('pt-BR')}</div>
                        {evento.anciaoAtende && <div className="text-xs text-muted-foreground mt-1">Ancião: {reduzirNome(evento.anciaoAtende)}</div>}
                      </button>
                    ))}
                    {eventosComSubtipo('Santa-Ceia').length === 0 && (
                      <div className="text-center text-muted-foreground py-4">Nenhuma Santa Ceia cadastrada na Agenda</div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              {/* Upload XLS Santa Ceia */}
              <input ref={uploadSantaCeiaRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleUploadSantaCeia} />
              <input ref={uploadSantaCeiaPDFRef} type="file" accept=".pdf" className="hidden" onChange={handleUploadSantaCeiaPDF} />
              <Button variant="outline" className="gap-2" onClick={baixarTemplateSantaCeia} title="Baixar template XLS">
                <FileSpreadsheet className="h-4 w-4" />
                Template
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => uploadSantaCeiaRef.current?.click()}>
                <Upload className="h-4 w-4" />
                Upload XLS
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => uploadSantaCeiaPDFRef.current?.click()}>
                <FileText className="h-4 w-4" />
                Upload PDF
              </Button>
              <Dialog open={openSantaCeia} onOpenChange={setOpenSantaCeia}>
                <DialogTrigger asChild>
                  <Button
                    className="gap-2"
                    onClick={() => {
                      setFormSantaCeia({ data: '', congregacaoId: '', irmaos: 0, irmas: 0, anciaoNome: '', anciaoLocalidade: '', diaconoNome: '', observacoes: '' });
                      setEditingSantaCeia(null);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Novo Resultado
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingSantaCeia ? 'Editar Santa Ceia' : 'Nova Santa Ceia'}</DialogTitle>
                  <DialogDescription>{editingSantaCeia ? 'Atualize os dados da Santa Ceia' : 'Registre uma nova Santa Ceia'}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitSantaCeia} className="space-y-4">
                  <div>
                    <Label>Data</Label>
                    <Input type="date" value={formSantaCeia.data} onChange={(e) => setFormSantaCeia({ ...formSantaCeia, data: e.target.value })} />
                  </div>
                  <div>
                    <Label>Congregação</Label>
                    <Select value={formSantaCeia.congregacaoId} onValueChange={(v) => setFormSantaCeia({ ...formSantaCeia, congregacaoId: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {congregacoes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.nome} {c.cidade ? `— ${c.cidade}` : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Ancião que Atende</Label>
                      <Input value={formSantaCeia.anciaoNome || ''} onChange={(e) => setFormSantaCeia({ ...formSantaCeia, anciaoNome: e.target.value })} placeholder="Nome do ancião" />
                    </div>
                    <div>
                      <Label>Localidade do Ancião</Label>
                      <Input value={formSantaCeia.anciaoLocalidade || ''} onChange={(e) => setFormSantaCeia({ ...formSantaCeia, anciaoLocalidade: e.target.value })} placeholder="Localidade" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Irmãos</Label>
                      <Input type="number" min="0" value={formSantaCeia.irmaos} onChange={(e) => setFormSantaCeia({ ...formSantaCeia, irmaos: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div>
                      <Label>Irmãs</Label>
                      <Input type="number" min="0" value={formSantaCeia.irmas} onChange={(e) => setFormSantaCeia({ ...formSantaCeia, irmas: parseInt(e.target.value) || 0 })} />
                    </div>
                  </div>
                  <div>
                    <Label>Observações</Label>
                    <Input value={formSantaCeia.observacoes} onChange={(e) => setFormSantaCeia({ ...formSantaCeia, observacoes: e.target.value })} placeholder="Opcional" />
                  </div>
                  <Button type="submit" className="w-full">Salvar</Button>
                </form>
              </DialogContent>
            </Dialog>
            </div>
          </div>

          <div className="grid gap-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-2 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Ano</label>
                <Select value={filterScYear} onValueChange={setFilterScYear}>
                  <SelectTrigger className="w-28"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {scYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Mês</label>
                <Select value={filterScMonth} onValueChange={setFilterScMonth}>
                  <SelectTrigger className="w-32"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {MONTH_NAMES.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Cidade</label>
                <Select value={filterScCity} onValueChange={(v) => { setFilterScCity(v); setFilterScCong('all'); }}>
                  <SelectTrigger className="w-36"><SelectValue placeholder="Todas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {scCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Congregação</label>
                <Select value={filterScCong} onValueChange={setFilterScCong}>
                  <SelectTrigger className="w-44"><SelectValue placeholder="Todas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {scCongsForCity.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {(filterScYear !== 'all' || filterScMonth !== 'all' || filterScCity !== 'all' || filterScCong !== 'all') && (
                <button onClick={() => { setFilterScYear('all'); setFilterScMonth('all'); setFilterScCity('all'); setFilterScCong('all'); }}
                  className="text-xs text-muted-foreground underline self-end pb-2">Limpar filtros</button>
              )}
              <span className="self-end pb-2 text-xs text-muted-foreground">{filteredSantaceias.length} resultado(s)</span>
            </div>

            {filteredSantaceias.map((santaceia) => (
              <Card key={santaceia.id} className="border-border">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground">{getCongregacaoNome(santaceia.congregacaoId)}</p>
                        {getCongregacaoCidade(santaceia.congregacaoId) && (
                          <span className="text-sm text-muted-foreground">— {getCongregacaoCidade(santaceia.congregacaoId)}</span>
                        )}
                        <Badge variant="outline">{new Date(santaceia.data + 'T12:00:00').toLocaleDateString('pt-BR')}</Badge>
                      </div>
                      {santaceia.anciaoNome && (
                        <p className="text-sm text-muted-foreground">
                          Ancião: <span className="font-medium text-foreground">{santaceia.anciaoNome}</span>
                          {santaceia.anciaoLocalidade && <span> — {santaceia.anciaoLocalidade}</span>}
                        </p>
                      )}
                      <div className="grid grid-cols-3 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Irmãos</p>
                          <p className="text-lg font-bold text-primary">{santaceia.irmaos}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Irmãs</p>
                          <p className="text-lg font-bold text-blue-600">{santaceia.irmas}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="text-lg font-bold text-foreground">{Number(santaceia.irmaos) + Number(santaceia.irmas)}</p>
                        </div>
                      </div>
                      {santaceia.observacoes && <p className="text-sm text-muted-foreground mt-2">{santaceia.observacoes}</p>}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFormSantaCeia({ ...santaceia, diaconoNome: santaceia.diaconoNome || '', anciaoNome: santaceia.anciaoNome || '', anciaoLocalidade: santaceia.anciaoLocalidade || '', observacoes: santaceia.observacoes || '' });
                          setEditingSantaCeia(santaceia.id);
                          setOpenSantaCeia(true);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeleteTarget({ id: santaceia.id, type: 'santaceia', label: `a Santa Ceia de ${getCongregacaoNome(santaceia.congregacaoId)}` })}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB: Ensaios Regionais */}
        <TabsContent value="ensaio" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Resultados de Ensaios Regionais</h2>
            <div className="flex gap-2">
              <Dialog open={openImportarEnsaio} onOpenChange={setOpenImportarEnsaio}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Importar Evento
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[60vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Importar Ensaio Regional</DialogTitle>
                    <DialogDescription>Selecione um ensaio regional salvo para carregar os dados automaticamente</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2">
                    {ensaiosRegionais.map((item: any) => (
                      <button
                        key={item.id}
                        onClick={() => importarEnsaio(item.id)}
                        className="w-full p-4 text-left border rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="font-semibold">{item.titulo}</div>
                        {item.local && <div className="text-sm text-muted-foreground">📍 {item.local}</div>}
                        <div className="text-sm text-muted-foreground">{item.data ? new Date(item.data + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</div>
                        {item.encarregadoRegional && <div className="text-xs text-muted-foreground mt-1">Encarregado: {reduzirNome(item.encarregadoRegional)}</div>}
                      </button>
                    ))}
                    {ensaiosRegionais.length === 0 && (
                      <div className="text-center text-muted-foreground py-4">Nenhum ensaio regional cadastrado</div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={openEnsaio} onOpenChange={setOpenEnsaio}>
                <DialogTrigger asChild>
                  <Button
                    className="gap-2"
                    onClick={() => {
                      setFormEnsaio({ data: '', titulo: '', local: '', musicos: [], organistas: 0, observacoes: '' });
                      setEditingEnsaio(null);
                      setNovoMusico({ nome: '', instrumento: '', localidade: '' });
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Novo Resultado
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingEnsaio ? 'Editar Ensaio' : 'Novo Ensaio Regional'}</DialogTitle>
                  <DialogDescription>{editingEnsaio ? 'Atualize os dados do ensaio' : 'Registre um novo ensaio regional'}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitEnsaio} className="space-y-4">
                  <div>
                    <Label>Data</Label>
                    <Input type="date" value={formEnsaio.data} onChange={(e) => setFormEnsaio({ ...formEnsaio, data: e.target.value })} />
                  </div>
                  <div>
                    <Label>Título</Label>
                    <Input value={formEnsaio.titulo} onChange={(e) => setFormEnsaio({ ...formEnsaio, titulo: e.target.value })} placeholder="Ex: Ensaio Regional de Música" />
                  </div>
                  <div>
                    <Label>Local</Label>
                    <Input value={formEnsaio.local} onChange={(e) => setFormEnsaio({ ...formEnsaio, local: e.target.value })} placeholder="Ex: Ituiutaba" />
                  </div>

                  <div className="border-t border-border pt-4">
                    <h3 className="font-medium text-sm mb-3">Músicos</h3>
                    <div className="space-y-3 mb-4">
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Nome" value={novoMusico.nome} onChange={(e) => setNovoMusico({ ...novoMusico, nome: e.target.value })} />
                        <Input placeholder="Instrumento" value={novoMusico.instrumento} onChange={(e) => setNovoMusico({ ...novoMusico, instrumento: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Localidade (opcional)" value={novoMusico.localidade} onChange={(e) => setNovoMusico({ ...novoMusico, localidade: e.target.value })} />
                        <Button type="button" variant="outline" onClick={adicionarMusico}>
                          Adicionar
                        </Button>
                      </div>
                    </div>

                    {formEnsaio.musicos.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {formEnsaio.musicos.map((musico: Musico) => (
                          <div key={musico.id} className="flex items-center justify-between bg-muted/30 p-2 rounded-lg text-sm">
                            <div>
                              <p className="font-medium">{musico.nome}</p>
                              <p className="text-xs text-muted-foreground">{musico.instrumento} {musico.localidade && `- ${musico.localidade}`}</p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removerMusico(musico.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Organistas</Label>
                    <Input type="number" min="0" value={formEnsaio.organistas} onChange={(e) => setFormEnsaio({ ...formEnsaio, organistas: parseInt(e.target.value) || 0 })} />
                  </div>

                  <div>
                    <Label>Observações</Label>
                    <Input value={formEnsaio.observacoes} onChange={(e) => setFormEnsaio({ ...formEnsaio, observacoes: e.target.value })} placeholder="Opcional" />
                  </div>
                  <Button type="submit" className="w-full">Salvar</Button>
                </form>
              </DialogContent>
            </Dialog>
            </div>
          </div>

          <div className="grid gap-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-2 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Ano</label>
                <Select value={filterEnsaioYear} onValueChange={setFilterEnsaioYear}>
                  <SelectTrigger className="w-28"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {ensaioYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Mês</label>
                <Select value={filterEnsaioMonth} onValueChange={setFilterEnsaioMonth}>
                  <SelectTrigger className="w-32"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {MONTH_NAMES.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {(filterEnsaioYear !== 'all' || filterEnsaioMonth !== 'all') && (
                <button onClick={() => { setFilterEnsaioYear('all'); setFilterEnsaioMonth('all'); }}
                  className="text-xs text-muted-foreground underline self-end pb-2">Limpar filtros</button>
              )}
              <span className="self-end pb-2 text-xs text-muted-foreground">{filteredEnsaios.length} resultado(s)</span>
            </div>

            {filteredEnsaios.map((ensaio) => {
              const instrumentos = ensaio.musicos.reduce((acc: Record<string, number>, m: Musico) => {
                acc[m.instrumento] = (acc[m.instrumento] || 0) + 1;
                return acc;
              }, {});

              return (
                <Card key={ensaio.id} className="border-border">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{ensaio.titulo}</p>
                          <Badge variant="outline">{new Date(ensaio.data + 'T12:00:00').toLocaleDateString('pt-BR')}</Badge>
                          <Badge className="text-xs">{ensaio.local}</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Músicos</p>
                            <p className="text-lg font-bold text-primary">{ensaio.musicos.length}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Organistas</p>
                            <p className="text-lg font-bold text-blue-600">{ensaio.organistas}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Total</p>
                            <p className="text-lg font-bold text-foreground">{ensaio.musicos.length + ensaio.organistas}</p>
                          </div>
                        </div>
                        {Object.keys(instrumentos).length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-medium mb-1">Instrumentos:</p>
                            <div className="flex gap-2 flex-wrap">
                              {Object.entries(instrumentos).map(([inst, count]: [string, number]) => (
                                <Badge key={inst} variant="secondary" className="text-xs">
                                  {inst}: {count}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {ensaio.observacoes && <p className="text-sm text-muted-foreground mt-2">{ensaio.observacoes}</p>}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const { id, ...ensaioSemId } = ensaio;
                            setFormEnsaio({
                              ...ensaioSemId,
                              musicos: ensaioSemId.musicos.map((m) => ({
                                ...m,
                                localidade: m.localidade || '',
                              })),
                              observacoes: ensaio.observacoes || '',
                            });
                            setEditingEnsaio(ensaio.id);
                            setOpenEnsaio(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setDeleteTarget({ id: ensaio.id, type: 'ensaio', label: `o ensaio "${ensaio.titulo}"` })}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
