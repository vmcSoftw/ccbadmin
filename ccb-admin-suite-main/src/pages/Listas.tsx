import { useState, useRef, useEffect } from 'react';
import { FileText, Download, Settings, Eye, Edit2, Trash2, ArrowLeft, RefreshCw, Plus } from 'lucide-react';
import { useCongregacoes, useMembros, useReforcos, useEventos, useListas, useEnsaios } from '@/hooks/useData';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Lista, Categoria, Aviso, ConfiguracaoEstilo, RegrasEnsaio } from '@/types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

export default function Listas() {
  const { congregacoes } = useCongregacoes();
  const { membros } = useMembros();
  const { reforcos } = useReforcos();
  const { eventos } = useEventos();
  const { ensaios } = useEnsaios();
  const { listas: listasFirebase, adicionar, remover, atualizar } = useListas();
  const previewRefGerenciar = useRef<HTMLDivElement>(null);
  const previewRefEditor = useRef<HTMLDivElement>(null);

  const [tela, setTela] = useState<'inicial' | 'formulario' | 'editor' | 'gerenciar'>('inicial');
  const [anoFiltro, setAnoFiltro] = useState(new Date().getFullYear());
  const [listaEditando, setListaEditando] = useState<Lista | null>(null);
  const [categoriasFiltro, setCategoriasFiltro] = useState('todas');
  const [novaCategoriaNome, setNovaCategoriaNome] = useState('');

  // Estado do formulário de nova lista
  const [formLista, setFormLista] = useState({
    nome: 'Lista de Batismos e Diversos',
    mes: new Date().getMonth(),
    ano: new Date().getFullYear(),
    dataInicio: new Date().toISOString().slice(0, 10),
    dataFim: new Date().toISOString().slice(0, 10),
  });

  // Estado do editor
  const [aba, setAba] = useState<'dados' | 'filtros' | 'preview'>('dados');
  const [selectedCongs, setSelectedCongs] = useState<string[]>([]);
  const [selectedMembros, setSelectedMembros] = useState<string[]>([]);
  const [incluirReforcos, setIncluirReforcos] = useState(false);
  const [incluirEventos, setIncluirEventos] = useState(false);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [filtroTiposReunioes, setFiltroTiposReunioes] = useState<string[]>([]);
  const [filtroTiposEventos, setFiltroTiposEventos] = useState<string[]>([]);

  // Estado da tela gerenciar
  const [abaGerenciar, setAbaGerenciar] = useState<'reunioes' | 'avisos' | 'preview' | 'configuracoes'>('reunioes');
  const [filtroSetorGerenciar, setFiltroSetorGerenciar] = useState('todos');
  const [filtroCategoriasGerenciar, setFiltroCategoriasGerenciar] = useState('todas');
  const [eventosParaSelecionar, setEventosParaSelecionar] = useState<string[]>([]);
  const [reforcoParaSelecionar, setReforcoParaSelecionar] = useState<string[]>([]);
  const [ensaiosParaSelecionar, setEnsaiosParaSelecionar] = useState<string[]>([]);
  const [filtroTipoReuniaoAtivo, setFiltroTipoReuniaoAtivo] = useState<string | null>(null);
  const [novoAvisoTitulo, setNovoAvisoTitulo] = useState('');
  const [novoAvisoAssunto, setNovoAvisoAssunto] = useState('');
  const [novoAvisoPreview, setNovoAvisoPreview] = useState(true);
  const [avisoModalOpen, setAvisoModalOpen] = useState(false);
  const [isNewList, setIsNewList] = useState(false);
  const [filtroSetor, setFiltroSetor] = useState('todos');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [paginaPreview, setPaginaPreview] = useState('1');
  
  // Estados para reordenação e configuração
  const [ordenacaoEventos, setOrdenacaoEventos] = useState<{ [tipo: string]: number }>({});
  const [estiloConfig, setEstiloConfig] = useState<ConfiguracaoEstilo>({
    tamanhoFonte: 'normal',
    alturaLinha: 'normal',
    espaçamentoParagrafo: 'normal',
    negrito: false,
  });

  // Configuração de preview
  const [configOpenListas, setConfigOpenListas] = useState(false);
  const [previewListasConfig, setPreviewListasConfig] = useState({
    cellHeight: 'normal' as 'pequeno' | 'normal' | 'grande',
    fontSize: 'normal' as 'pequeno' | 'normal' | 'grande',
    bold: false,
    sortBy: 'data' as 'data' | 'congregacao' | 'localidade',
    fontFamily: 'Calibri' as 'Calibri' | 'Arial' | 'Verdana' | 'Times New Roman',
    lineHeight: 'normal' as 'compacto' | 'normal' | 'espaçoso',
    borderColor: 'gray-900' as 'gray-900' | 'gray-700' | 'gray-600',
    eventOrder: ['Reuniões', 'Batismo', 'Santa-Ceia', 'Reunião para Mocidade', 'Busca dos Dons', 'RJM com Busca dos Dons', 'Reunião Setorial', 'Reunião Ministerial', 'Reunião Extra', 'Culto para Jovens', 'Ensaio Regional', 'Ordenação', 'Reforços', 'RJM Reforços'] as string[],
  });

  // Sincronizar estilos e ordem dos eventos quando lista é selecionada
  useEffect(() => {
    if (listaEditando?.estiloConfig) {
      setEstiloConfig(listaEditando.estiloConfig);
    }
    if (listaEditando?.ordenacaoEventos) {
      setOrdenacaoEventos(listaEditando.ordenacaoEventos);
    }
    if (listaEditando?.eventOrder) {
      setPreviewListasConfig(prev => ({ ...prev, eventOrder: listaEditando.eventOrder }));
    }
  }, [listaEditando?.id, listaEditando?.estiloConfig, listaEditando?.ordenacaoEventos, listaEditando?.eventOrder]);

  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const novaLista = () => {
    setFormLista({
      nome: 'Lista de Batismos e Diversos',
      mes: new Date().getMonth(),
      ano: new Date().getFullYear(),
      dataInicio: new Date().toISOString().slice(0, 10),
      dataFim: new Date().toISOString().slice(0, 10),
    });
    setIsNewList(true);
    setTela('formulario');
  };

  const salvarFormularioLista = async () => {
    if (!formLista.nome.trim()) {
      alert('Nome da lista é obrigatório!');
      return;
    }
    if (formLista.dataInicio && formLista.dataFim && formLista.dataInicio > formLista.dataFim) {
      alert('Data de início não pode ser posterior à data de fim!');
      return;
    }
    const novaListaObj: Omit<Lista, 'id'> = {
      nome: formLista.nome.trim(),
      mes: formLista.mes,
      ano: formLista.ano,
      ativa: true,
      data: new Date().toISOString().slice(0, 10),
      dataInicio: formLista.dataInicio,
      dataFim: formLista.dataFim,
      categorias: [],
      avisos: [],
      eventosSelected: [],
      reforcosSelecionados: [],
    };
    try {
      await adicionar(novaListaObj);
      setListaEditando({ id: 'temp', ...novaListaObj });
      setEventosParaSelecionar([]);
      setReforcoParaSelecionar([]);
      setEnsaiosParaSelecionar([]);
      setFiltroTipoReuniaoAtivo(null);
      setTela('gerenciar');
      setCategoriasFiltro('todas');
      setNovaCategoriaNome('');
      setAbaGerenciar('reunioes');
      setFiltroSetorGerenciar('todos');
      setFiltroCategoriasGerenciar('todas');
      setIsNewList(true);
      resetFormulario();
    } catch (error) {
      console.error('Erro ao criar lista:', error);
      alert('Erro ao criar lista. Tente novamente.');
    }
  };

  const editarLista = (lista: Lista) => {
    setListaEditando(lista);
    setEventosParaSelecionar(lista.eventosSelected || []);
    setReforcoParaSelecionar(lista.reforcosSelecionados || []);
    setEnsaiosParaSelecionar(lista.ensaiosSelecionados || []);
    setFiltroTipoReuniaoAtivo(null);
    setAbaGerenciar('reunioes');
    setFiltroSetorGerenciar('todos');
    setFiltroCategoriasGerenciar('todas');
    setIsNewList(false);
    setTela('gerenciar');
  };

  const deletarLista = async (id: string) => {
    try {
      await remover(id);
    } catch (error) {
      console.error('Erro ao deletar lista:', error);
      alert('Erro ao deletar lista. Tente novamente.');
    }
  };

  const salvarLista = async () => {
    if (!listaEditando) return;
    const listaFinal = {
      ...listaEditando,
      eventosSelected: eventosParaSelecionar,
      reforcosSelecionados: reforcoParaSelecionar,
      ensaiosSelecionados: ensaiosParaSelecionar,
      avisos: listaEditando.avisos || [],
      eventOrder: previewListasConfig.eventOrder,
    };
    try {
      // Se a lista tem um ID válido do Firebase, atualiza; caso contrário, adiciona
      if (listaEditando.id && !listaEditando.id.startsWith('temp')) {
        await atualizar(listaEditando.id, listaFinal);
      } else {
        const { id, ...listaParaAdicionar } = listaFinal;
        await adicionar(listaParaAdicionar);
      }
      setTela('inicial');
      setListaEditando(null);
      setEventosParaSelecionar([]);
      setReforcoParaSelecionar([]);
      setEnsaiosParaSelecionar([]);
      setCategoriasFiltro('todas');
      setNovaCategoriaNome('');
      setAbaGerenciar('reunioes');
      setFiltroSetorGerenciar('todos');
      setFiltroCategoriasGerenciar('todas');
      setIsNewList(false);
    } catch (error) {
      console.error('Erro ao salvar lista:', error);
      alert('Erro ao salvar lista. Tente novamente.');
    }
  };

  const adicionarCategoria = () => {
    if (!listaEditando || !novaCategoriaNome.trim()) return;
    const novaCategoria: Categoria = {
      id: Date.now().toString(),
      nome: novaCategoriaNome,
    };
    setListaEditando((prev) =>
      prev
        ? { ...prev, categorias: [...prev.categorias, novaCategoria] }
        : null
    );
    setNovaCategoriaNome('');
  };

  const removerCategoria = (id: string) => {
    setListaEditando((prev) =>
      prev
        ? { ...prev, categorias: prev.categorias.filter((c) => c.id !== id) }
        : null
    );
  };

  const editarCategoria = (id: string, nome: string) => {
    setListaEditando((prev) =>
      prev
        ? {
            ...prev,
            categorias: prev.categorias.map((c) =>
              c.id === id ? { ...c, nome } : c
            ),
          }
        : null
    );
  };

  const adicionarAviso = () => {
    if (!listaEditando || !novoAvisoTitulo.trim() || !novoAvisoAssunto.trim()) return;
    const novoAviso: Aviso = {
      id: Date.now().toString(),
      titulo: novoAvisoTitulo,
      assunto: novoAvisoAssunto,
      mostrarNoPreview: novoAvisoPreview,
    };
    setListaEditando((prev) =>
      prev
        ? { ...prev, avisos: [...(prev.avisos || []), novoAviso] }
        : null
    );
    setNovoAvisoTitulo('');
    setNovoAvisoAssunto('');
    setNovoAvisoPreview(true);
    setAvisoModalOpen(false);
  };

  const removerAviso = (id: string) => {
    setListaEditando((prev) =>
      prev
        ? { ...prev, avisos: (prev.avisos || []).filter((a) => a.id !== id) }
        : null
    );
  };

  const listasFiltradas = listasFirebase.filter((l) => l.ano === anoFiltro).sort((a, b) => a.mes - b.mes);

  const resetFormulario = () => {
    setSelectedCongs([]);
    setSelectedMembros([]);
    setIncluirReforcos(false);
    setIncluirEventos(false);
    setDataInicio('');
    setDataFim('');
    setFiltroTiposReunioes([]);
    setFiltroTiposEventos([]);
    setAbaGerenciar('reunioes');
    setFiltroSetorGerenciar('todos');
    setFiltroCategoriasGerenciar('todas');
  };

  const tiposReunioesDisponiveis = ['Batismo', 'Santa-Ceia', 'Reunião para Mocidade', 'Busca dos Dons', 'Reunião Setorial', 'Reunião Ministerial', 'Reunião Extra', 'Culto para Jovens', 'Ensaio Regional', 'Ordenação'];
  const tiposEventosDisponiveis = ['Culto', 'RJM', 'Ensaio', 'Jovens', 'Outro'];
  const tiposReforcoDisponiveis = ['Culto', 'RJM'];

  const toggleCong = (id: string) => {
    setSelectedCongs((s) => (s.includes(id) ? s.filter((i) => i !== id) : [...s, id]));
  };

  const toggleMembro = (id: string) => {
    setSelectedMembros((s) => (s.includes(id) ? s.filter((i) => i !== id) : [...s, id]));
  };

  const toggleFiltroTipoReuniao = (tipo: string) => {
    setFiltroTiposReunioes((s) => (s.includes(tipo) ? s.filter((i) => i !== tipo) : [...s, tipo]));
  };

  const toggleFiltroTipoEvento = (tipo: string) => {
    setFiltroTiposEventos((s) => (s.includes(tipo) ? s.filter((i) => i !== tipo) : [...s, tipo]));
  };

  const getEventosFiltrados = () => {
    let filtered = [...eventos];
    if (dataInicio) filtered = filtered.filter((e) => e.data >= dataInicio);
    if (dataFim) filtered = filtered.filter((e) => e.data <= dataFim);
    if (filtroTiposEventos.length > 0) {
      filtered = filtered.filter((e) => filtroTiposEventos.includes(e.tipo));
    }
    if (filtroTiposReunioes.length > 0) {
      filtered = filtered.filter((e) => e.subtipoReuniao && filtroTiposReunioes.includes(e.subtipoReuniao));
    }
    return filtered.sort((a, b) => a.data.localeCompare(b.data));
  };

  const getReforcosFiltrados = () => {
    let filtered = [...reforcos];
    if (dataInicio) filtered = filtered.filter((r) => r.data >= dataInicio);
    if (dataFim) filtered = filtered.filter((r) => r.data <= dataFim);
    if (tiposReforcoDisponiveis.length > 0 && filtroTiposEventos.length > 0) {
      filtered = filtered.filter((r) => filtroTiposEventos.includes(r.tipo));
    }
    return filtered.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  };

  const getCongregacaoNome = (id: string) => {
    const congregacao = congregacoes.find((c) => c.id === id);
    if (!congregacao) return '';
    return `${congregacao.nome} - ${congregacao.cidade}`;
  };

  const getPaddingClass = () => {
    switch (previewListasConfig.cellHeight) {
      case 'pequeno': return 'py-0.5 px-1';
      case 'grande': return 'py-3 px-2';
      default: return 'py-1 px-1.5';
    }
  };

  const getFontSizeClass = () => {
    switch (previewListasConfig.fontSize) {
      case 'pequeno': return 'text-xs';
      case 'grande': return 'text-base';
      default: return 'text-sm';
    }
  };

  const getFontWeightClass = () => {
    return previewListasConfig.bold ? 'font-bold' : 'font-medium';
  };

  const getFontFamilyStyle = () => {
    const families: { [key: string]: string } = {
      'Calibri': "'Calibri', 'Arial', sans-serif",
      'Arial': "'Arial', 'Helvetica', sans-serif",
      'Verdana': "'Verdana', 'Geneva', sans-serif",
      'Times New Roman': "'Times New Roman', 'Times', serif"
    };
    return families[previewListasConfig.fontFamily] || families['Calibri'];
  };

  const getLineHeightClass = () => {
    switch (previewListasConfig.lineHeight) {
      case 'compacto': return 'leading-tight';
      case 'espaçoso': return 'leading-relaxed';
      default: return 'leading-normal';
    }
  };

  const getSortedEventTypes = (tipos: string[]) => {
    return tipos.sort((a, b) => {
      const indexA = previewListasConfig.eventOrder.indexOf(a);
      const indexB = previewListasConfig.eventOrder.indexOf(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  };

  const reduzirNome = (nome: string) => {
    if (!nome) return '';
    
    // Exceção especial: João Pereira de Oliveira Neto
    if (nome.toUpperCase().includes('JOÃO PEREIRA DE OLIVEIRA NETO') || 
        nome.toUpperCase().includes('JOÃO PEREIRA DE OLIVEIRA') && nome.toUpperCase().includes('NETO')) {
      return 'João de Oliveira';
    }
    
    const partes = nome.trim().split(/\s+/);
    if (partes.length <= 1) return nome;
    
    // Preposições comuns em nomes
    const preposicoes = ['de', 'da', 'do', 'dei', 'del', 'dos', 'das', 'di'];
    
    // Encontrar a primeira preposição
    let indexPreposicao = -1;
    for (let i = 1; i < partes.length; i++) {
      if (preposicoes.includes(partes[i].toLowerCase())) {
        indexPreposicao = i;
        break;
      }
    }
    
    // Se há preposição no índice 2 ou maior (preposição após pelo menos 2 nomes)
    // Retorna os dois primeiros nomes: "João Neves" em "João Neves da Silva"
    if (indexPreposicao >= 2) {
      return `${partes[0]} ${partes[1]}`;
    }
    
    // Se há preposição no índice 1 e há palavra após ela
    // Retorna primeiro + preposição + próximo: "João de Silva"
    if (indexPreposicao === 1 && indexPreposicao < partes.length - 1) {
      return `${partes[0]} ${partes[indexPreposicao]} ${partes[indexPreposicao + 1]}`;
    }
    
    // Caso contrário, retorna primeiro nome + último nome
    return `${partes[0]} ${partes[partes.length - 1]}`;
  };

  const getDisplayName = (tipo: string): string => {
    const displayNames: { [key: string]: string } = {
      'AGO': 'Assembléia Geral Ordinária',
      'Reuniões': 'Reuniões',
      'Santa-Ceia': 'Santa-Ceia',
      'Batismo': 'Batismo',
      'Reunião para Mocidade': 'Reunião para Mocidade',
      'Busca dos Dons': 'Busca dos Dons',
      'RJM com Busca dos Dons': 'RJM com Busca dos Dons',
      'Reunião Setorial': 'Reunião Setorial',
      'Reunião Ministerial': 'Reunião Ministerial',
      'Reunião Extra': 'Reunião Extra',
      'Culto para Jovens': 'Culto para Jovens',
      'Ensaio Regional': 'Ensaio Regional',
      'Ordenação': 'Ordenação'
    };
    return displayNames[tipo] || tipo;
  };

  const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  const calcularDatasEnsaio = (regra: RegrasEnsaio, ano: number): string[] => {
    const datas: string[] = [];
    const indiceDia = diasSemana.indexOf(regra.diasSemana?.[0]) ?? -1;
    if (indiceDia === -1) return datas;

    const mesesParaProcessar = regra.meses && regra.meses.length > 0 ? regra.meses : [];
    
    for (const mes of mesesParaProcessar) {
      let contador = 0;
      
      for (let dia = 1; dia <= 31; dia++) {
        const data = new Date(ano, mes - 1, dia);
        if (data.getMonth() !== mes - 1) break;
        
        if (data.getDay() === (indiceDia + 1) % 7) {
          contador++;
          if (contador === regra.semanas?.[0]) {
            const dataISO = data.toISOString().split('T')[0];
            datas.push(dataISO);
            break;
          }
        }
      }
    }
    
    return datas.sort();
  };

  const getEnsaiosAgendados = (mes: number, ano: number) => {
    const ensaiosAgendados: { titulo: string; data: string; horario: string; local: string; anciao?: string; encarregadoRegional?: string }[] = [];
    
    ensaios.forEach(ensaio => {
      if (!ensaio.ativo) return;
      
      ensaio.regras.forEach(regra => {
        if (!regra.meses || !regra.meses.includes(mes)) return;
        if (!regra.diasSemana || regra.diasSemana.length === 0) return;
        if (!regra.semanas || regra.semanas.length === 0) return;

        const datas = calcularDatasEnsaio(regra, ano);
        datas.forEach(data => {
          ensaiosAgendados.push({
            titulo: ensaio.titulo,
            data,
            horario: regra.horario,
            local: ensaio.local,
            anciao: ensaio.anciao,
            encarregadoRegional: ensaio.encarregadoRegional,
          });
        });
      });
    });
    
    return ensaiosAgendados.sort((a, b) => a.data.localeCompare(b.data));
  };

  const gerarPDF = async () => {
    const activeRef = tela === 'gerenciar' ? previewRefGerenciar : previewRefEditor;
    if (!activeRef.current) return;
    
    try {
      const element = activeRef.current;
      
      // Criar um wrapper temporário
      const wrapper = document.createElement('div');
      wrapper.id = 'pdf-wrapper';
      wrapper.style.position = 'absolute';
      wrapper.style.left = '-9999px';
      wrapper.style.width = '210mm';
      wrapper.style.margin = '0';
      wrapper.style.padding = '5mm';
      wrapper.style.backgroundColor = 'white';
      wrapper.style.color = '#000';
      wrapper.style.fontFamily = getFontFamilyStyle();
      
      // Clonar elemento
      const clone = element.cloneNode(true) as HTMLElement;
      
      // Gerar data e hora do rodapé
      const agora = new Date();
      const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
      const dia = agora.getDate();
      const mes = meses[agora.getMonth()];
      const ano = agora.getFullYear();
      const horas = agora.getHours();
      const minutos = String(agora.getMinutes()).padStart(2, '0');
      
      const rodapeTexto = `Ituiutaba/MG, ${dia} de ${mes.charAt(0).toUpperCase() + mes.slice(1)} de ${ano} às ${horas}h${minutos}`;
      
      // Criar elemento do rodapé
      const rodapeDiv = document.createElement('div');
      rodapeDiv.style.marginTop = '30px';
      rodapeDiv.style.paddingTop = '20px';
      rodapeDiv.style.borderTop = '1px solid #999';
      rodapeDiv.style.textAlign = 'right';
      rodapeDiv.style.fontSize = '10pt';
      rodapeDiv.style.fontFamily = getFontFamilyStyle();
      rodapeDiv.style.color = '#333';
      rodapeDiv.textContent = rodapeTexto;
      
      // Adicionar rodapé ao clone
      clone.appendChild(rodapeDiv);
      
      // Copiar estilos computados para TODOS os elementos
      const allElements = clone.querySelectorAll('*');
      allElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const computed = window.getComputedStyle(htmlEl);
        
        // Copiar styles de texto e cor
        htmlEl.style.color = computed.color;
        htmlEl.style.fontSize = computed.fontSize;
        htmlEl.style.fontWeight = computed.fontWeight;
        htmlEl.style.fontStyle = computed.fontStyle;
        htmlEl.style.fontFamily = computed.fontFamily;
        htmlEl.style.letterSpacing = computed.letterSpacing;
        htmlEl.style.textTransform = computed.textTransform;
        htmlEl.style.textDecoration = computed.textDecoration;
        
        // Copiar estilos de background e border
        htmlEl.style.backgroundColor = computed.backgroundColor;
        htmlEl.style.borderColor = computed.borderColor;
        htmlEl.style.borderWidth = computed.borderWidth;
        htmlEl.style.borderStyle = computed.borderStyle;
        
        // Copiar espaçamento
        htmlEl.style.margin = computed.margin;
        htmlEl.style.padding = computed.padding;
        htmlEl.style.lineHeight = computed.lineHeight;
        
        // Forçar alinhamento à esquerda, EXCETO para cabeçalho (manter centrado)
        if (htmlEl.classList.contains('text-center') || computed.textAlign === 'center') {
          htmlEl.style.textAlign = 'center';
        } else {
          htmlEl.style.textAlign = 'left';
        }
        htmlEl.style.verticalAlign = 'middle';
        
        // Remover apenas inputs, buttons, checkboxes e flex containers interativos
        if (htmlEl.tagName === 'INPUT' || 
            htmlEl.tagName === 'BUTTON' || 
            (htmlEl.classList && htmlEl.classList.contains('flex'))) {
          htmlEl.style.display = 'none !important';
        }
      });
      
      // Restaurar alinhamento do rodapé (direita)
      rodapeDiv.style.textAlign = 'right';
      
      wrapper.appendChild(clone);
      document.body.appendChild(wrapper);
      
      // Aguardar render
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Renderizar com html2canvas
      const canvas = await html2canvas(wrapper, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: 1000,
        logging: false,
        allowTaint: true,
        imageTimeout: 0,
        removeContainer: false,
      });
      
      // Criar PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const availableWidth = pageWidth - (margin * 2);
      
      // Calcular proporções
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = availableWidth / imgWidth;
      
      // Quebrar em páginas
      let yOffset = 0;
      let isFirstPage = true;
      
      while (yOffset < imgHeight) {
        if (!isFirstPage) {
          pdf.addPage();
        }
        
        const availableHeight = (pageHeight - (margin * 2)) / ratio;
        const heightToCopy = Math.min(availableHeight, imgHeight - yOffset);
        
        // Slice do canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = imgWidth;
        tempCanvas.height = Math.ceil(heightToCopy);
        
        const ctx = tempCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            canvas,
            0, yOffset,
            imgWidth, heightToCopy,
            0, 0,
            imgWidth, heightToCopy
          );
        }
        
        const imgData = tempCanvas.toDataURL('image/png');
        const imgHeightOnPage = heightToCopy * ratio;
        
        pdf.addImage(imgData, 'PNG', margin, margin, availableWidth, imgHeightOnPage);
        
        yOffset += heightToCopy;
        isFirstPage = false;
        
        if (yOffset >= imgHeight) break;
      }
      
      pdf.save(`lista-ccb-${new Date().toISOString().slice(0, 10)}.pdf`);
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      const wrapper = document.getElementById('pdf-wrapper');
      if (wrapper && wrapper.parentNode) {
        document.body.removeChild(wrapper);
      }
    }
  };

  const gerarXLS = () => {
    try {
      const activeRef = tela === 'gerenciar' ? previewRefGerenciar : previewRefEditor;
      if (!activeRef.current) return;

      const element = activeRef.current;
      const tables = element.querySelectorAll('table');
      
      if (tables.length === 0) {
        alert('Nenhuma tabela encontrada para exportar.');
        return;
      }

      const workbook = XLSX.utils.book_new();
      
      // Extrair todas as tabelas
      tables.forEach((table, index) => {
        // Obter nome da tabela a partir do header anterior
        let tableName = `Tabela ${index + 1}`;
        const previousElement = table.previousElementSibling;
        if (previousElement && previousElement.textContent) {
          tableName = previousElement.textContent.trim();
        }
        
        // Extrair dados da tabela manualmente para melhor compatibilidade
        const rows: string[][] = [];
        const tableRows = table.querySelectorAll('tr');
        
        tableRows.forEach((row) => {
          const cells = row.querySelectorAll('td, th');
          const rowData: string[] = [];
          cells.forEach((cell) => {
            rowData.push(cell.textContent?.trim() || '');
          });
          if (rowData.length > 0) {
            rows.push(rowData);
          }
        });
        
        if (rows.length === 0) return;
        
        const worksheet = XLSX.utils.aoa_to_sheet(rows);
        
        // Ajustar largura das colunas
        const maxWidth = Math.max(...rows.map(row => row.length)) || 1;
        const colWidths = Array(maxWidth).fill(18);
        worksheet['!cols'] = colWidths.map(width => ({ wch: width }));
        
        // Rotular a aba (Excel tem limite de 31 caracteres)
        const sheetName = tableName.substring(0, 31);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      });

      // Criar aba dodapé com data e localização
      const agora = new Date();
      const dias = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
      const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
      
      const dia = agora.getDate();
      const mes = meses[agora.getMonth()];
      const ano = agora.getFullYear();
      const horas = String(agora.getHours()).padStart(2, '0');
      const minutos = String(agora.getMinutes()).padStart(2, '0');
      
      const rodapeTexto = `Ituiutaba-MG, ${dia} de ${mes} de ${ano} - ${horas}:${minutos}`;
      
      const rodapeSheet = XLSX.utils.aoa_to_sheet([[rodapeTexto]]);
      rodapeSheet['!cols'] = [{ wch: 50 }];
      XLSX.utils.book_append_sheet(workbook, rodapeSheet, 'Rodapé');

      // Salvar arquivo
      XLSX.writeFile(workbook, `lista-ccb-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (error) {
      console.error('Erro ao gerar XLS:', error);
      alert('Erro ao gerar arquivo XLS. Verifique se há dados para exportar.');
    }
  };

  const hasSelection = selectedCongs.length > 0 || selectedMembros.length > 0 || incluirReforcos || incluirEventos || ensaiosParaSelecionar.length > 0;

  const importarTodos = () => {
    // Importar todos os eventos
    const todosEventos = eventosReuniao.map(e => e.id);
    setEventosParaSelecionar(todosEventos);

    // Importar todos os reforços
    const todosReforcos = reforcosSalvos.map(r => r.id);
    setReforcoParaSelecionar(todosReforcos);

    // Importar todos os ensaios
    const todosEnsaios = ensaios.map(e => e.id);
    setEnsaiosParaSelecionar(todosEnsaios);
  };

  // TELA: FORMULÁRIO NOVA LISTA
  if (tela === 'formulario') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setTela('inicial')}
        />
        
        {/* Modal */}
        <div className="relative glass-card rounded-2xl p-8 w-full max-w-md shadow-2xl border border-border/50">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold font-display text-foreground">Nova Lista</h2>
            <p className="text-sm text-muted-foreground mt-1">Crie uma nova lista de eventos</p>
          </div>

          {/* Form */}
          <div className="space-y-5">
            {/* Nome da Lista */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">Nome da Lista</Label>
              <Input
                value={formLista.nome}
                onChange={(e) => setFormLista({ ...formLista, nome: e.target.value })}
                placeholder="Lista de Batismos e Diversos"
                className="w-full"
              />
            </div>

            {/* Mês e Ano - Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold mb-2 block">Mês</Label>
                <select
                  value={formLista.mes}
                  onChange={(e) => setFormLista({ ...formLista, mes: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {meses.map((m, i) => (
                    <option key={i} value={i}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-sm font-semibold mb-2 block">Ano</Label>
                <select
                  value={formLista.ano}
                  onChange={(e) => setFormLista({ ...formLista, ano: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((ano) => (
                    <option key={ano} value={ano}>
                      {ano}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Data Início e Fim - Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold mb-2 block">Data Início</Label>
                <Input
                  type="date"
                  value={formLista.dataInicio}
                  onChange={(e) => setFormLista({ ...formLista, dataInicio: e.target.value })}
                  className="w-full"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold mb-2 block">Data Fim</Label>
                <Input
                  type="date"
                  value={formLista.dataFim}
                  onChange={(e) => setFormLista({ ...formLista, dataFim: e.target.value })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-border">
            <Button
              onClick={() => setTela('inicial')}
              variant="outline"
              className="flex-1"
            >
              Voltar
            </Button>
            <Button
              onClick={salvarFormularioLista}
              disabled={!formLista.nome.trim() || (formLista.dataInicio && formLista.dataFim && formLista.dataInicio > formLista.dataFim)}
              className="flex-1 gap-2"
            >
              Salvar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Funções auxiliares para gerenciar
  const eventosSalvos = eventos.filter(e => {
    if (listaEditando?.dataInicio) {
      const eventoDate = e.data;
      const dataInicio = listaEditando?.dataInicio ? new Date(listaEditando.dataInicio + 'T00:00:00') : null;
      const dataFim = listaEditando?.dataFim ? new Date(listaEditando.dataFim + 'T23:59:59') : null;
      if (dataInicio && eventoDate < new Date(dataInicio).toISOString().slice(0, 10)) return false;
      if (dataFim && eventoDate > new Date(dataFim).toISOString().slice(0, 10)) return false;
    }
    return true;
  }).sort((a, b) => a.data.localeCompare(b.data));

  const eventosReuniao = eventosSalvos.filter(e => e.subtipoReuniao);
  const eventosAvisos = eventosSalvos.filter(e => !e.subtipoReuniao);

  const reforcosSalvos = reforcos.filter(r => {
    if (listaEditando?.dataInicio) {
      const reforcoDate = r.data;
      const dataInicio = listaEditando?.dataInicio ? new Date(listaEditando.dataInicio + 'T00:00:00') : null;
      const dataFim = listaEditando?.dataFim ? new Date(listaEditando.dataFim + 'T23:59:59') : null;
      if (dataInicio && reforcoDate < new Date(dataInicio).toISOString().slice(0, 10)) return false;
      if (dataFim && reforcoDate > new Date(dataFim).toISOString().slice(0, 10)) return false;
    }
    return true;
  }).sort((a, b) => a.data.localeCompare(b.data));

  const tiposEventosUnicos = [...new Set(eventosAvisos.map(e => e.tipo))].sort();

  // TELA: GERENCIAR CATEGORIAS
  if (tela === 'gerenciar' && listaEditando) {
    const categoriasFiltradas = categoriasFiltro === 'todas' ? listaEditando.categorias : listaEditando.categorias.filter(c => c.nome === categoriasFiltro);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => { 
              setTela('inicial'); 
              setListaEditando(null);
              setEventosParaSelecionar([]);
              setReforcoParaSelecionar([]);
              setFiltroTipoReuniaoAtivo(null);
              setIsNewList(false);
            }}
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <h1 className="text-2xl font-bold font-display text-foreground">
            {meses[listaEditando.mes]} de {listaEditando.ano}
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={gerarXLS}>
              <Download className="h-4 w-4" /> Exportar
            </Button>
            <Button variant="outline" className="gap-2" onClick={importarTodos}>
              <Plus className="h-4 w-4" /> Importar Tudo
            </Button>
            <Button variant="outline" className="gap-2" onClick={salvarLista}>
              <RefreshCw className="h-4 w-4" /> Atualizar
            </Button>
          </div>
        </div>

        {/* Abas */}
        <div className="flex gap-4 border-b border-border">
          <button
            onClick={() => setAbaGerenciar('reunioes')}
            className={`px-4 py-2 font-medium ${
              abaGerenciar === 'reunioes'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Reuniões
          </button>
          <button
            onClick={() => setAbaGerenciar('avisos')}
            className={`px-4 py-2 font-medium ${
              abaGerenciar === 'avisos'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Avisos
          </button>
          <button
            onClick={() => setAbaGerenciar('preview')}
            className={`px-4 py-2 font-medium ${
              abaGerenciar === 'preview'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Preview
          </button>
        </div>

        {/* ABA: REUNIÕES */}
        {abaGerenciar === 'reunioes' && (
          <div className="space-y-6">
            {/* SEÇÃO: FILTRO POR TIPO DE REUNIÃO - CARDS CLICÁVEIS */}
            {eventosReuniao.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Filtrar por Tipo de Evento/Reunião</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {/* Card: Todos */}
                  <button
                    onClick={() => setFiltroTipoReuniaoAtivo(null)}
                    className={`p-4 rounded-lg transition-all border-2 ${
                      filtroTipoReuniaoAtivo === null
                        ? 'border-primary bg-primary/10 shadow-lg'
                        : 'border-border bg-card hover:border-primary/50 hover:shadow-md'
                    }`}
                  >
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-bold text-foreground">{eventosReuniao.length}</div>
                      <div className="text-xs font-semibold text-foreground uppercase">Todos</div>
                    </div>
                  </button>

                  {/* Cards: Por Tipo */}
                  {[...new Set(eventosReuniao.map(e => e.subtipoReuniao))].sort().map((tipoReuniao) => {
                    const eventosPorTipo = eventosReuniao.filter(e => e.subtipoReuniao === tipoReuniao);
                    return (
                      <button
                        key={tipoReuniao}
                        onClick={() => setFiltroTipoReuniaoAtivo(tipoReuniao)}
                        className={`p-4 rounded-lg transition-all border-2 ${
                          filtroTipoReuniaoAtivo === tipoReuniao
                            ? 'border-primary bg-primary/10 shadow-lg'
                            : 'border-border bg-card hover:border-primary/50 hover:shadow-md'
                        }`}
                      >
                        <div className="text-center space-y-2">
                          <div className="text-2xl font-bold text-foreground">{eventosPorTipo.length}</div>
                          <div className="text-xs font-semibold text-foreground uppercase text-wrap">{tipoReuniao}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SEÇÃO: EVENTOS IMPORTADOS */}
            {eventosReuniao.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">
                    Eventos Agendados {filtroTipoReuniaoAtivo && `- ${filtroTipoReuniaoAtivo}`} (Selecione para Preview)
                  </h3>
                  <Badge variant="secondary">{eventosParaSelecionar.length}/{eventosReuniao.length} selecionados</Badge>
                </div>

                {[...new Set(eventosReuniao.map(e => e.subtipoReuniao))].sort().map((tipoReuniao) => {
                  // Se há filtro ativo, mostra apenas esse tipo
                  if (filtroTipoReuniaoAtivo && filtroTipoReuniaoAtivo !== tipoReuniao) {
                    return null;
                  }

                  const eventosPorTipo = eventosReuniao.filter(e => e.subtipoReuniao === tipoReuniao);
                  return (
                    <div key={tipoReuniao} className="space-y-2">
                      <h4 className="font-semibold text-sm text-foreground uppercase">{tipoReuniao}</h4>
                      <div className="glass-card rounded-lg overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-muted/50 border-b border-border">
                              <th className="px-4 py-2 text-left w-8">
                                <Checkbox 
                                  checked={eventosPorTipo.every(e => eventosParaSelecionar.includes(e.id))}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setEventosParaSelecionar(prev => [...new Set([...prev, ...eventosPorTipo.map(e => e.id)])])
                                    } else {
                                      setEventosParaSelecionar(prev => prev.filter(id => !eventosPorTipo.some(e => e.id === id)))
                                    }
                                    setListaEditando(prev => prev ? { ...prev, eventosSelected: prev.eventosSelected || [] } : null)
                                  }}
                                />
                              </th>
                              <th className="px-4 py-2 text-left">Data</th>
                              <th className="px-4 py-2 text-left">Hora</th>
                              <th className="px-4 py-2 text-left">Localidade</th>
                              <th className="px-4 py-2 text-left">{tipoReuniao === 'Reunião Ministerial' ? 'Participam' : 'Irmão'}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {eventosPorTipo.map((e) => (
                              <tr key={e.id} className="border-b border-border hover:bg-muted/30">
                                <td className="px-4 py-2">
                                  <Checkbox 
                                    checked={eventosParaSelecionar.includes(e.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setEventosParaSelecionar(prev => [...prev, e.id])
                                      } else {
                                        setEventosParaSelecionar(prev => prev.filter(id => id !== e.id))
                                      }
                                      setListaEditando(prev => prev ? { ...prev, eventosSelected: prev.eventosSelected || [] } : null)
                                    }}
                                  />
                                </td>
                                <td className="px-4 py-2">{new Date(e.data + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                                <td className="px-4 py-2">{e.horario || '—'}</td>
                                <td className="px-4 py-2">{getCongregacaoNome(e.congregacaoId) || '—'}</td>
                                <td className="px-4 py-2">
                                  {tipoReuniao === 'Reunião Ministerial' 
                                    ? (e.descricao ? e.descricao : '—')
                                    : (e.anciaoAtende ? reduzirNome(e.anciaoAtende) : '—')
                                  }
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {eventosReuniao.length === 0 && (
              <div className="glass-card rounded-xl p-8 text-center">
                <p className="text-muted-foreground">Nenhum evento agendado para este período.</p>
              </div>
            )}

            {/* DIVISOR */}
            {eventosReuniao.length > 0 && (
              <div className="border-t border-border pt-6" />
            )}

            {/* SEÇÃO: REFORÇOS IMPORTADOS */}
            {reforcosSalvos.length > 0 && (
              <div className="space-y-4">
                {/* Filtro por Tipo de Reforço */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Filtrar Reforços por Tipo</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {/* Card: Todos */}
                    <button
                      onClick={() => setFiltroTipoReuniaoAtivo(null)}
                      className={`p-4 rounded-lg transition-all border-2 ${
                        filtroTipoReuniaoAtivo === null
                          ? 'border-primary bg-primary/10 shadow-lg'
                          : 'border-border bg-card hover:border-primary/50 hover:shadow-md'
                      }`}
                    >
                      <div className="text-center space-y-2">
                        <div className="text-2xl font-bold text-foreground">{reforcosSalvos.length}</div>
                        <div className="text-xs font-semibold text-foreground uppercase">Todos Reforços</div>
                      </div>
                    </button>

                    {/* Cards: Por Tipo */}
                    {[...new Set(reforcosSalvos.map(r => r.tipo))].sort().map((tipoReforco) => {
                      const reforcosPorTipo = reforcosSalvos.filter(r => r.tipo === tipoReforco);
                      return (
                        <button
                          key={`reforco-${tipoReforco}`}
                          onClick={() => setFiltroTipoReuniaoAtivo(`reforco-${tipoReforco}`)}
                          className={`p-4 rounded-lg transition-all border-2 ${
                            filtroTipoReuniaoAtivo === `reforco-${tipoReforco}`
                              ? 'border-primary bg-primary/10 shadow-lg'
                              : 'border-border bg-card hover:border-primary/50 hover:shadow-md'
                          }`}
                        >
                          <div className="text-center space-y-2">
                            <div className="text-2xl font-bold text-foreground">{reforcosPorTipo.length}</div>
                            <div className="text-xs font-semibold text-foreground uppercase">Reforço - {tipoReforco}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Reforços (Selecione para Preview)</h3>
                  <Badge variant="secondary">{reforcoParaSelecionar.length}/{reforcosSalvos.length} selecionados</Badge>
                </div>

                {[...new Set(reforcosSalvos.map(r => r.tipo))].sort().map((tipoReforco) => {
                  // Se há filtro ativo para reforços, mostra apenas esse tipo
                  if (filtroTipoReuniaoAtivo && filtroTipoReuniaoAtivo !== `reforco-${tipoReforco}`) {
                    return null;
                  }
                  // Se há filtro ativo para eventos, não mostra nada
                  if (filtroTipoReuniaoAtivo && !filtroTipoReuniaoAtivo.startsWith('reforco-')) {
                    return null;
                  }

                  const reforcosPorTipo = reforcosSalvos.filter(r => r.tipo === tipoReforco);
                  return (
                    <div key={tipoReforco} className="space-y-2">
                      <h4 className="font-semibold text-sm text-foreground uppercase">Reforço - {tipoReforco}</h4>
                      <div className="glass-card rounded-lg overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-muted/50 border-b border-border">
                              <th className="px-4 py-2 text-left w-8">
                                <Checkbox 
                                  checked={reforcosPorTipo.every(r => reforcoParaSelecionar.includes(r.id))}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setReforcoParaSelecionar(prev => [...new Set([...prev, ...reforcosPorTipo.map(r => r.id)])])
                                    } else {
                                      setReforcoParaSelecionar(prev => prev.filter(id => !reforcosPorTipo.some(r => r.id === id)))
                                    }
                                    setListaEditando(prev => prev ? { ...prev, reforcosSelecionados: prev.reforcosSelecionados || [] } : null)
                                  }}
                                />
                              </th>
                              <th className="px-4 py-2 text-left">Data</th>
                              <th className="px-4 py-2 text-left">Hora</th>
                              <th className="px-4 py-2 text-left">Localidade</th>
                              <th className="px-4 py-2 text-left">Irmãos</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reforcosPorTipo.map((r) => (
                              <tr key={r.id} className="border-b border-border hover:bg-muted/30">
                                <td className="px-4 py-2">
                                  <Checkbox 
                                    checked={reforcoParaSelecionar.includes(r.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setReforcoParaSelecionar(prev => [...prev, r.id])
                                      } else {
                                        setReforcoParaSelecionar(prev => prev.filter(id => id !== r.id))
                                      }
                                      setListaEditando(prev => prev ? { ...prev, reforcosSelecionados: prev.reforcosSelecionados || [] } : null)
                                    }}
                                  />
                                </td>
                                <td className="px-4 py-2">{new Date(r.data + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                                <td className="px-4 py-2">{r.horario || '—'}</td>
                                <td className="px-4 py-2">{getCongregacaoNome(r.congregacaoId) || '—'}</td>
                                <td className="px-4 py-2">{(() => {
                                  const membrosLocais = r.membros.length > 0 ? r.membros.map(id => reduzirNome(membros.find(m => m.id === id)?.nome || '—')) : [];
                                  const membrosOutras = r.membrosOutrasLocalidades ? r.membrosOutrasLocalidades.map(m => `${reduzirNome(m.nome)} (${m.localidade})`) : [];
                                  return [...membrosLocais, ...membrosOutras].join(', ') || '—';
                                })()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* DIVISOR */}
            {reforcosSalvos.length > 0 && eventosReuniao.length > 0 && (
              <div className="border-t border-border pt-6" />
            )}

            {/* SEÇÃO: ENSAIOS REGIONAIS */}
            {ensaios.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Ensaios Regionais (Selecione para Preview)</h3>
                  <Badge variant="secondary">
                    {ensaiosParaSelecionar.length}/{ensaios.length} selecionados
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-foreground uppercase">Ensaios Regionais</h4>
                  <div className="glass-card rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/50 border-b border-border">
                          <th className="px-4 py-2 text-left w-8">
                            <Checkbox 
                              checked={
                                ensaios.length > 0 &&
                                ensaios.every((e) => ensaiosParaSelecionar.includes(e.id))
                              }
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setEnsaiosParaSelecionar(prev => [...new Set([...prev, ...ensaios.map(e => e.id)])])
                                } else {
                                  setEnsaiosParaSelecionar(prev => prev.filter(id => !ensaios.some(e => e.id === id)))
                                }
                              }}
                            />
                          </th>
                          <th className="px-4 py-2 text-left">Data</th>
                          <th className="px-4 py-2 text-left">Horário</th>
                          <th className="px-4 py-2 text-left">Congregação</th>
                          <th className="px-4 py-2 text-left">Ancião</th>
                          <th className="px-4 py-2 text-left">Encarregado Regional</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ensaios.map((ensaio) => {
                          const nomeAnciao = ensaio.anciaoOutraLocalidade 
                            ? ensaio.anciaoOutraLocalidade.nome
                            : ensaio.anciao 
                              ? reduzirNome(membros.find(m => m.id === ensaio.anciao)?.nome || ensaio.anciao)
                              : '—';
                          
                          const nomeEncarregado = ensaio.encarregadoRegionalOutraLocalidade
                            ? ensaio.encarregadoRegionalOutraLocalidade.nome
                            : ensaio.encarregadoRegional
                              ? reduzirNome(membros.find(m => m.id === ensaio.encarregadoRegional)?.nome || ensaio.encarregadoRegional)
                              : '—';
                          
                          return (
                            <tr key={ensaio.id} className="border-b border-border hover:bg-muted/30">
                              <td className="px-4 py-2">
                                <Checkbox 
                                  checked={ensaiosParaSelecionar.includes(ensaio.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setEnsaiosParaSelecionar(prev => [...prev, ensaio.id])
                                    } else {
                                      setEnsaiosParaSelecionar(prev => prev.filter(id => id !== ensaio.id))
                                    }
                                  }}
                                />
                              </td>
                              <td className="px-4 py-2">{ensaio.data ? new Date(ensaio.data + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                              <td className="px-4 py-2">{ensaio.horario || '—'}</td>
                              <td className="px-4 py-2">{ensaio.congregacaoId ? getCongregacaoNome(ensaio.congregacaoId) : '—'}</td>
                              <td className="px-4 py-2 text-xs">{nomeAnciao}</td>
                              <td className="px-4 py-2 text-xs">{nomeEncarregado}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ABA: AVISOS */}
        {abaGerenciar === 'avisos' && (
          <div className="space-y-6">
            {/* Botão de novo aviso */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Avisos Personalizados</h3>
              <Button 
                onClick={() => setAvisoModalOpen(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" /> Novo Aviso
              </Button>
            </div>

            {/* Lista de Avisos - Tabela */}
            {listaEditando?.avisos && listaEditando.avisos.length > 0 ? (
              <div className="glass-card rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="px-4 py-3 text-left font-semibold">Título</th>
                      <th className="px-4 py-3 text-left font-semibold">Assunto</th>
                      <th className="px-4 py-3 text-left font-semibold w-24">Preview</th>
                      <th className="px-4 py-3 text-center w-12">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listaEditando.avisos.map((aviso) => (
                      <tr key={aviso.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-semibold text-foreground">{aviso.titulo}</td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-normal max-w-md truncate">{aviso.assunto}</td>
                        <td className="px-4 py-3 text-center">
                          {aviso.mostrarNoPreview !== false && (
                            <Badge variant="outline" className="text-xs">Sim</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => removerAviso(aviso.id)}
                            className="p-2 hover:bg-destructive/10 hover:text-destructive rounded transition-colors inline-flex"
                            title="Remover aviso"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="glass-card rounded-xl p-12 text-center border-2 border-dashed border-border">
                <p className="text-muted-foreground">Nenhum aviso adicionado ainda.</p>
              </div>
            )}

            {/* Modal: Novo Aviso */}
            {avisoModalOpen && (
              <>
                <div 
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                  onClick={() => {
                    setAvisoModalOpen(false);
                    setNovoAvisoTitulo('');
                    setNovoAvisoAssunto('');
                    setNovoAvisoPreview(true);
                  }}
                />
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="glass-card rounded-2xl p-8 w-full max-w-md shadow-2xl border border-border/50">
                    <h2 className="text-2xl font-bold mb-6">Novo Aviso</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-semibold mb-2 block">Título</Label>
                        <Input
                          value={novoAvisoTitulo}
                          onChange={(e) => setNovoAvisoTitulo(e.target.value)}
                          placeholder="Título do aviso"
                          onKeyPress={(e) => e.key === 'Enter' && adicionarAviso()}
                        />
                      </div>
                      
                      <div>
                        <Label className="text-sm font-semibold mb-2 block">Assunto</Label>
                        <textarea
                          value={novoAvisoAssunto}
                          onChange={(e) => setNovoAvisoAssunto(e.target.value)}
                          placeholder="Descrição do aviso"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                          rows={4}
                        />
                      </div>

                      <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                        <Checkbox
                          checked={novoAvisoPreview}
                          onCheckedChange={(checked) => setNovoAvisoPreview(!!checked)}
                        />
                        <Label className="text-sm font-medium cursor-pointer">Importar para o Preview</Label>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-8 pt-6 border-t border-border">
                      <Button
                        onClick={() => {
                          setAvisoModalOpen(false);
                          setNovoAvisoTitulo('');
                          setNovoAvisoAssunto('');
                          setNovoAvisoPreview(true);
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={adicionarAviso}
                        disabled={!novoAvisoTitulo.trim() || !novoAvisoAssunto.trim()}
                        className="flex-1"
                      >
                        Adicionar
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ABA: PREVIEW */}
        {abaGerenciar === 'preview' && (
          <div className="space-y-6">
            {eventosParaSelecionar.length === 0 && reforcoParaSelecionar.length === 0 ? (
              <div className="glass-card rounded-xl p-12 text-center">
                <p className="text-muted-foreground">Nenhum evento ou reforço selecionado para visualizar.</p>
                <p className="text-sm mt-2 text-muted-foreground">Vá para a aba Reuniões e selecione itens para visualizar aqui.</p>
              </div>
            ) : (
              <>
                {/* CONTROLES DE PREVIEW - NÃO SERÁ INCLUÍDO NO PDF */}
                <div className="flex justify-between items-center gap-3">
                  <Button 
                    onClick={() => setConfigOpenListas(true)}
                    variant="outline"
                    className="gap-2"
                  >
                    <Settings className="h-4 w-4" /> Configurar
                  </Button>
                  <div className="flex gap-3">
                    <Button 
                      onClick={gerarPDF} 
                      disabled={eventosParaSelecionar.length === 0 && reforcoParaSelecionar.length === 0}
                      className="gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                      <FileText className="h-4 w-4" /> Gerar PDF
                    </Button>
                    <Button 
                      onClick={gerarXLS} 
                      disabled={eventosParaSelecionar.length === 0 && reforcoParaSelecionar.length === 0}
                      className="gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <Download className="h-4 w-4" /> Gerar XLS
                    </Button>
                  </div>
                </div>

                {/* PREVIEW CONTENT - SERÁ INCLUÍDO NO PDF */}
                <div className="border-2 border-border rounded-lg overflow-hidden">
                  <div className={`bg-white p-3 space-y-2 ${getLineHeightClass()}`} ref={previewRefGerenciar} style={{ fontFamily: getFontFamilyStyle() }}>
                    {/* CABEÇALHO */}
                    <div className="lista-section text-center space-y-0.5 pb-2 border-b-2 border-gray-800">
                      <div className="text-xs font-semibold tracking-wider">CONGREGAÇÃO CRISTÃ NO BRASIL</div>
                      <div className="text-xs font-semibold tracking-wider">REGIONAL UBERLÂNDIA - {meses[listaEditando?.mes || 0].toUpperCase()} DE {listaEditando?.ano || new Date().getFullYear()}</div>
                      <div className="text-xs font-semibold tracking-wider">ADMINISTRAÇÃO DE ITUIUTABA</div>
                      <div className="text-sm font-bold mt-1.5">{listaEditando?.nome || 'LISTA'}</div>
                    </div>

                    {/* EVENTOS, REFORÇOS E ENSAIOS - ORDENADOS CONFORME CONFIGURAÇÃO DO USUÁRIO */}
                    {(() => {
                      // Coletar todos os tipos de serviços
                      const tiposEventos = [...new Set(eventosReuniao.filter(e => eventosParaSelecionar.includes(e.id)).map(e => e.subtipoReuniao))];
                      const tiposReforcos = [...new Set(reforcosSalvos.filter(r => reforcoParaSelecionar.includes(r.id)).map(r => r.tipo))];
                      const tiposEnsaios = ensaiosParaSelecionar.length > 0 ? ['Ensaio Regional'] : [];
                      
                      // Consolidar e ordenar
                      const todosTipos = getSortedEventTypes([...tiposEventos, ...tiposReforcos, ...tiposEnsaios]);
                      
                      return todosTipos.length > 0 && (
                        <div className="space-y-2">
                          {todosTipos.map((tipo) => {
                            // Determinar qual seção renderizar
                            const eventos = eventosReuniao.filter(e => e.subtipoReuniao === tipo && eventosParaSelecionar.includes(e.id));
                            const reforcosFiltered = reforcosSalvos.filter(r => r.tipo === tipo && reforcoParaSelecionar.includes(r.id));
                            const ensaiosFiltered = tipo === 'Ensaio Regional' ? ensaios.filter(e => ensaiosParaSelecionar.includes(e.id)) : [];
                            
                            if (eventos.length === 0 && reforcosFiltered.length === 0 && ensaiosFiltered.length === 0) {
                              return null;
                            }
                            
                            // Renderizar EVENTOS
                            if (eventos.length > 0) {
                              return (
                                <div key={`evento-${tipo}`} className="lista-section space-y-1">
                                  <div className="flex items-center justify-between pb-1 border-b border-gray-900">
                                    <h5 className="font-bold text-sm text-gray-900 uppercase">{getDisplayName(tipo)}</h5>
                                    <input type="checkbox" className="w-4 h-4 cursor-pointer" />
                                  </div>
                                  <table className="w-full border-collapse">
                                    <thead>
                                      <tr className="bg-gray-300 border border-gray-900">
                                        <th className={`border border-gray-900 ${getPaddingClass()} ${getFontWeightClass()} text-left align-middle ${getFontSizeClass()} text-gray-900 break-words`}>DATA</th>
                                        <th className={`border border-gray-900 ${getPaddingClass()} ${getFontWeightClass()} text-left align-middle ${getFontSizeClass()} text-gray-900 break-words`}>HORA</th>
                                        <th className={`border border-gray-900 ${getPaddingClass()} ${getFontWeightClass()} text-left align-middle ${getFontSizeClass()} text-gray-900 break-words`}>LOCALIDADE</th>
                                        {tipo !== 'Reuniões' && <th className={`border border-gray-900 ${getPaddingClass()} ${getFontWeightClass()} text-left align-middle ${getFontSizeClass()} text-gray-900 break-words`}>{tipo === 'Reunião Ministerial' ? 'PARTICIPAM' : 'ANCIÃO'}</th>}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {eventos.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()).map((e, index) => {
                                        const dataObj = new Date(e.data + 'T12:00:00');
                                        const diasSemana = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
                                        const dataBR = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                                        const diaSemana = diasSemana[dataObj.getDay()];
                                        return (
                                          <tr key={e.id} className="border border-gray-900 bg-white">
                                            <td className={`border border-gray-900 ${getPaddingClass()} ${getFontSizeClass()} text-left align-middle text-gray-900 break-words`}>{dataBR} {diaSemana}</td>
                                            <td className={`border border-gray-900 ${getPaddingClass()} text-left align-middle ${getFontSizeClass()} text-gray-900 break-words`}>{e.horario || '-'}</td>
                                            <td className={`border border-gray-900 ${getPaddingClass()} ${getFontSizeClass()} text-left align-middle text-gray-900 break-words`}>{getCongregacaoNome(e.congregacaoId) || '-'}</td>
                                            {tipo !== 'Reuniões' && (
                                              <td className={`border border-gray-900 ${getPaddingClass()} ${getFontSizeClass()} text-left align-middle text-gray-900 break-words`}>
                                                {tipo === 'Reunião Ministerial' 
                                                  ? (e.descricao ? e.descricao : '-')
                                                  : (reduzirNome(e.anciaoAtende) ? reduzirNome(e.anciaoAtende) : '-')
                                                }
                                              </td>
                                            )}
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              );
                            }
                            
                            // Renderizar REFORÇOS
                            if (reforcosFiltered.length > 0) {
                              return (
                                <div key={`reforco-${tipo}`} className="lista-section space-y-1">
                                  <div className="flex items-center justify-between pb-1 border-b border-gray-900">
                                    <h5 className="font-bold text-sm text-gray-900 uppercase">REFORÇO - {getDisplayName(tipo)}</h5>
                                    <input type="checkbox" className="w-4 h-4 cursor-pointer" />
                                  </div>
                                  <table className="w-full border-collapse">
                                    <thead>
                                      <tr className="bg-gray-300 border border-gray-900">
                                        <th className={`border border-gray-900 ${getPaddingClass()} ${getFontWeightClass()} text-left align-middle ${getFontSizeClass()} text-gray-900 break-words`}>DATA</th>
                                        <th className={`border border-gray-900 ${getPaddingClass()} ${getFontWeightClass()} text-left align-middle ${getFontSizeClass()} text-gray-900 break-words`}>HORA</th>
                                        <th className={`border border-gray-900 ${getPaddingClass()} ${getFontWeightClass()} text-left align-middle ${getFontSizeClass()} text-gray-900 break-words`}>LOCALIDADE</th>
                                        <th className={`border border-gray-900 ${getPaddingClass()} ${getFontWeightClass()} text-left align-middle ${getFontSizeClass()} text-gray-900 break-words`}>IRMÃO</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {reforcosFiltered.sort((a, b) => a.data.localeCompare(b.data)).map((r) => {
                                        const dataObj = new Date(r.data + 'T12:00:00');
                                        const diasSemanaAbr = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
                                        const dataBR = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                                        const diaSemana = diasSemanaAbr[dataObj.getDay()];
                                        
                                        const membrosLocais = r.membros && r.membros.length > 0 
                                          ? r.membros.map(id => reduzirNome(membros.find(m => m.id === id)?.nome || '-')).filter(nome => nome !== '-')
                                          : [];
                                        const membrosOutras = r.membrosOutrasLocalidades && r.membrosOutrasLocalidades.length > 0
                                          ? r.membrosOutrasLocalidades.map(m => `${reduzirNome(m.nome)} (${m.localidade})`)
                                          : [];
                                        const todosMembros = [...membrosLocais, ...membrosOutras].join(', ') || '-';
                                        
                                        return (
                                          <tr key={r.id} className="border border-gray-900 bg-white">
                                            <td className={`border border-gray-900 ${getPaddingClass()} ${getFontSizeClass()} text-left align-middle text-gray-900 break-words`}>{dataBR} {diaSemana}</td>
                                            <td className={`border border-gray-900 ${getPaddingClass()} text-left align-middle ${getFontSizeClass()} text-gray-900 break-words`}>{r.horario || '-'}</td>
                                            <td className={`border border-gray-900 ${getPaddingClass()} ${getFontSizeClass()} text-left align-middle text-gray-900 break-words`}>{getCongregacaoNome(r.congregacaoId) || '-'}</td>
                                            <td className={`border border-gray-900 ${getPaddingClass()} ${getFontSizeClass()} text-left align-middle text-gray-900 break-words`}>{todosMembros}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              );
                            }
                            
                            // Renderizar ENSAIOS REGIONAIS
                            if (ensaiosFiltered.length > 0) {
                              return (
                                <div key={`ensaio-${tipo}`} className="lista-section space-y-1">
                                  <div className="flex items-center justify-between pb-1 border-b border-gray-900">
                                    <h5 className="font-bold text-sm text-gray-900 uppercase">{getDisplayName(tipo)}</h5>
                                    <input type="checkbox" className="w-4 h-4 cursor-pointer" />
                                  </div>
                                  <table className="w-full border-collapse">
                                    <thead>
                                      <tr className="bg-gray-300 border border-gray-900">
                                        <th className={`border border-gray-900 ${getPaddingClass()} ${getFontWeightClass()} text-left align-middle ${getFontSizeClass()} text-gray-900 break-words`}>DATA</th>
                                        <th className={`border border-gray-900 ${getPaddingClass()} ${getFontWeightClass()} text-left align-middle ${getFontSizeClass()} text-gray-900 break-words`}>HORÁRIO</th>
                                        <th className={`border border-gray-900 ${getPaddingClass()} ${getFontWeightClass()} text-left align-middle ${getFontSizeClass()} text-gray-900 break-words`}>CONGREGAÇÃO</th>
                                        <th className={`border border-gray-900 ${getPaddingClass()} ${getFontWeightClass()} text-left align-middle ${getFontSizeClass()} text-gray-900 break-words`}>ANCIÃO</th>
                                        <th className={`border border-gray-900 ${getPaddingClass()} ${getFontWeightClass()} text-left align-middle ${getFontSizeClass()} text-gray-900 break-words`}>ENC. REGIONAL</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {ensaiosFiltered.map((ensaio) => {
                                        const nomeAnciao = ensaio.anciaoOutraLocalidade
                                          ? ensaio.anciaoOutraLocalidade.nome
                                          : ensaio.anciao 
                                            ? reduzirNome(membros.find(m => m.id === ensaio.anciao)?.nome || '-')
                                            : '-';
                                        const nomeEncarregado = ensaio.encarregadoRegionalOutraLocalidade
                                          ? ensaio.encarregadoRegionalOutraLocalidade.nome
                                          : ensaio.encarregadoRegional
                                            ? reduzirNome(membros.find(m => m.id === ensaio.encarregadoRegional)?.nome || '-')
                                            : '-';
                                        const dataBR = ensaio.data 
                                          ? new Date(ensaio.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
                                          : '-';
                                        
                                        return (
                                          <tr key={ensaio.id} className="border border-gray-900 bg-white">
                                            <td className={`border border-gray-900 ${getPaddingClass()} ${getFontSizeClass()} text-left align-middle text-gray-900 break-words`}>{dataBR}</td>
                                            <td className={`border border-gray-900 ${getPaddingClass()} ${getFontSizeClass()} text-left align-middle text-gray-900 break-words`}>{ensaio.horario || '-'}</td>
                                            <td className={`border border-gray-900 ${getPaddingClass()} ${getFontSizeClass()} text-left align-middle text-gray-900 break-words`}>{getCongregacaoNome(ensaio.congregacaoId) || '-'}</td>
                                            <td className={`border border-gray-900 ${getPaddingClass()} ${getFontSizeClass()} text-left align-middle text-gray-900 break-words`}>{nomeAnciao}</td>
                                            <td className={`border border-gray-900 ${getPaddingClass()} ${getFontSizeClass()} text-left align-middle text-gray-900 break-words`}>{nomeEncarregado}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              );
                            }
                            
                            return null;
                          })}
                        </div>
                      );
                    })()}

                    {/* RODAPÉ: AVISOS */}
                    {listaEditando?.avisos && listaEditando.avisos.filter(a => a.mostrarNoPreview !== false).length > 0 && (
                      <div className="lista-section space-y-2">
                        <div className="flex items-center justify-between pb-1 border-b border-gray-900">
                          <h5 className={`font-bold ${getFontSizeClass()} text-gray-900 uppercase`}>AVISOS</h5>
                          <input type="checkbox" className="w-4 h-4 cursor-pointer" />
                        </div>
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-300 border border-gray-900">
                              <th className={`border border-gray-900 ${getPaddingClass()} ${getFontWeightClass()} text-left align-middle ${getFontSizeClass()} text-gray-900 break-words`}>TÍTULO</th>
                              <th className={`border border-gray-900 ${getPaddingClass()} ${getFontWeightClass()} text-left align-middle ${getFontSizeClass()} text-gray-900 break-words`}>ASSUNTO</th>
                            </tr>
                          </thead>
                          <tbody>
                            {listaEditando.avisos.filter(a => a.mostrarNoPreview !== false).map((aviso) => (
                              <tr key={aviso.id} className="border border-gray-900 bg-white">
                                <td className={`border border-gray-900 ${getPaddingClass()} ${getFontWeightClass()} ${getFontSizeClass()} text-left align-middle text-gray-900 break-words`}>{aviso.titulo}</td>
                                <td className={`border border-gray-900 ${getPaddingClass()} ${getFontSizeClass()} text-left align-middle text-gray-800 break-words`}>{aviso.assunto}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* DIALOG: CONFIGURAÇÃO DO PREVIEW */}
                <Dialog open={configOpenListas} onOpenChange={setConfigOpenListas}>
                  <DialogContent className="max-w-7xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Configurar Visualização</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-3 gap-6 pr-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="sort-by">Ordenação</Label>
                          <Select value={previewListasConfig.sortBy} onValueChange={(value) => setPreviewListasConfig({...previewListasConfig, sortBy: value as 'data' | 'congregacao' | 'localidade'})}>
                            <SelectTrigger id="sort-by">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="data">Por Data</SelectItem>
                              <SelectItem value="congregacao">Por Congregação</SelectItem>
                              <SelectItem value="localidade">Por Localidade</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="cell-height">Espaçamento de Linhas</Label>
                          <Select value={previewListasConfig.cellHeight} onValueChange={(value) => setPreviewListasConfig({...previewListasConfig, cellHeight: value as 'pequeno' | 'normal' | 'grande'})}>
                            <SelectTrigger id="cell-height">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pequeno">Pequeno</SelectItem>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="grande">Grande</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="font-size">Tamanho da Fonte</Label>
                          <Select value={previewListasConfig.fontSize} onValueChange={(value) => setPreviewListasConfig({...previewListasConfig, fontSize: value as 'pequeno' | 'normal' | 'grande'})}>
                            <SelectTrigger id="font-size">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pequeno">Pequeno</SelectItem>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="grande">Grande</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="bold-text" 
                            checked={previewListasConfig.bold}
                            onCheckedChange={(checked) => setPreviewListasConfig({...previewListasConfig, bold: checked as boolean})}
                          />
                          <Label htmlFor="bold-text" className="cursor-pointer">Negrito</Label>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="font-family">Tipo de Fonte</Label>
                          <Select value={previewListasConfig.fontFamily} onValueChange={(value) => setPreviewListasConfig({...previewListasConfig, fontFamily: value as 'Calibri' | 'Arial' | 'Verdana' | 'Times New Roman'})}>
                            <SelectTrigger id="font-family">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Calibri">Calibri</SelectItem>
                              <SelectItem value="Arial">Arial</SelectItem>
                              <SelectItem value="Verdana">Verdana</SelectItem>
                              <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="line-height">Espaçamento de Linhas Internas</Label>
                          <Select value={previewListasConfig.lineHeight} onValueChange={(value) => setPreviewListasConfig({...previewListasConfig, lineHeight: value as 'compacto' | 'normal' | 'espaçoso'})}>
                            <SelectTrigger id="line-height">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="compacto">Compacto</SelectItem>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="espaçoso">Espaçoso</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="border-color">Cor das Bordas</Label>
                          <Select value={previewListasConfig.borderColor} onValueChange={(value) => setPreviewListasConfig({...previewListasConfig, borderColor: value as 'gray-900' | 'gray-700' | 'gray-600'})}>
                            <SelectTrigger id="border-color">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gray-900">Escuro</SelectItem>
                              <SelectItem value="gray-700">Médio</SelectItem>
                              <SelectItem value="gray-600">Claro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Ordem dos Tipos de Eventos</Label>
                        <div className="border border-gray-300 rounded p-3 space-y-1 max-h-80 overflow-y-auto">
                          {previewListasConfig.eventOrder.map((tipo, index) => (
                            <div key={tipo} className="flex items-center gap-2 text-sm">
                              <span className="font-medium text-gray-600 w-5">{index + 1}.</span>
                              <span className="flex-1 truncate">{tipo}</span>
                              <div className="flex gap-1">
                                {index > 0 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 w-6 p-0"
                                    onClick={() => {
                                      const novaOrder = [...previewListasConfig.eventOrder];
                                      [novaOrder[index - 1], novaOrder[index]] = [novaOrder[index], novaOrder[index - 1]];
                                      setPreviewListasConfig({...previewListasConfig, eventOrder: novaOrder});
                                    }}
                                  >
                                    ↑
                                  </Button>
                                )}
                                {index < previewListasConfig.eventOrder.length - 1 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 w-6 p-0"
                                    onClick={() => {
                                      const novaOrder = [...previewListasConfig.eventOrder];
                                      [novaOrder[index], novaOrder[index + 1]] = [novaOrder[index + 1], novaOrder[index]];
                                      setPreviewListasConfig({...previewListasConfig, eventOrder: novaOrder});
                                    }}
                                  >
                                    ↓
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <DialogFooter className="mt-4">
                      <Button onClick={() => setConfigOpenListas(false)}>Fechar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        )}

        {/* Botão Salvar */}

        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={() => { 
              setTela('inicial'); 
              setListaEditando(null); 
              setEventosParaSelecionar([]);
              setReforcoParaSelecionar([]);
              setIsNewList(false);
            }}
          >
            Cancelar
          </Button>
          <Button onClick={salvarLista}>
            Salvar Alterações
          </Button>
        </div>
      </div>
    );
  }

  if (tela === 'inicial') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-display text-foreground">Listas</h1>
            <p className="text-sm text-muted-foreground mt-1">Gerencie listas de eventos, reuniões e reforços</p>
          </div>
          <Button onClick={novaLista} className="gap-2 h-10 px-6">
            <FileText className="h-4 w-4" /> Nova Lista
          </Button>
        </div>

        {/* Filtro de Ano */}
        <div className="glass-card rounded-lg p-4 flex items-center gap-4">
          <Label className="font-semibold text-foreground">Filtrar por Ano:</Label>
          <select
            value={anoFiltro}
            onChange={(e) => setAnoFiltro(parseInt(e.target.value))}
            className="px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((ano) => (
              <option key={ano} value={ano}>
                {ano}
              </option>
            ))}
          </select>
        </div>

        {/* Tabela de Listas com Layout Melhorado */}
        {listasFiltradas.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center border-2 border-dashed border-border">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-lg font-semibold text-muted-foreground">Nenhuma lista para {anoFiltro}</p>
            <p className="text-sm text-muted-foreground mt-1">Comece criando uma nova lista clicando no botão acima</p>
          </div>
        ) : (
          <div className="space-y-3">
            {listasFiltradas.map((lista) => (
              <div 
                key={lista.id} 
                className="glass-card rounded-lg p-5 flex items-center justify-between hover:bg-muted/60 transition-colors border border-border/50"
              >
                <div className="flex-1 flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-lg">{lista.nome}</h3>
                    <p className="text-sm text-muted-foreground">{meses[lista.mes]} • {lista.ano}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant={lista.ativa ? 'default' : 'secondary'} className="px-3 py-1">
                    {lista.ativa ? '✓ Ativada' : 'Desativada'}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => editarLista(lista)}
                    className="p-2.5 hover:bg-primary/10 rounded-lg transition-colors text-primary hover:text-primary/80"
                    title="Editar lista"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => deletarLista(lista.id)}
                    className="p-2.5 hover:bg-destructive/10 rounded-lg transition-colors text-destructive hover:text-destructive/80"
                    title="Deletar lista"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (tela === 'editor') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground">Listas</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Organize e exporte dados de congregações, eventos e reforços
            </p>
          </div>
          <Button onClick={() => { setTela('inicial'); setListaEditando(null); }} variant="outline" className="gap-2">
            Voltar
          </Button>
        </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setAba('dados')}
          className={`px-4 py-2 font-medium text-sm transition-all ${
            aba === 'dados'
              ? 'border-b-2 border-primary text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Dados
        </button>
        <button
          onClick={() => setAba('filtros')}
          className={`px-4 py-2 font-medium text-sm transition-all ${
            aba === 'filtros'
              ? 'border-b-2 border-primary text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Filtros
        </button>
        <button
          onClick={() => setAba('preview')}
          className={`px-4 py-2 font-medium text-sm transition-all ${
            aba === 'preview'
              ? 'border-b-2 border-primary text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Preview
        </button>
      </div>

      {/* ABA: DADOS */}
      {aba === 'dados' && (
        <div className="space-y-6">
          {/* Informações da Lista */}
          <div className="glass-card rounded-xl p-5 space-y-4">
            <h3 className="font-semibold font-display text-foreground">Informações da Lista</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-sm mb-2 block">Nome da Lista</Label>
                <Input
                  value={listaEditando?.nome || ''}
                  onChange={(e) => setListaEditando((prev) => prev ? { ...prev, nome: e.target.value } : null)}
                  placeholder="Nome da lista"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">Mês</Label>
                <select
                  value={listaEditando?.mes || 0}
                  onChange={(e) => setListaEditando((prev) => prev ? { ...prev, mes: parseInt(e.target.value) } : null)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {meses.map((m, i) => (
                    <option key={i} value={i}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-sm mb-2 block">Ano</Label>
                <select
                  value={listaEditando?.ano || new Date().getFullYear()}
                  onChange={(e) => setListaEditando((prev) => prev ? { ...prev, ano: parseInt(e.target.value) } : null)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((ano) => (
                    <option key={ano} value={ano}>
                      {ano}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Congregações */}
          <div className="glass-card rounded-xl p-5 space-y-3">
            <h3 className="font-semibold font-display text-foreground">Congregações</h3>
            {congregacoes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma congregação cadastrada.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {[...congregacoes]
                  .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                  .map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={selectedCongs.includes(c.id)} onCheckedChange={() => toggleCong(c.id)} />
                    <span className="text-foreground">{c.nome}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Ministério */}
          <div className="glass-card rounded-xl p-5 space-y-3">
            <h3 className="font-semibold font-display text-foreground">Ministério</h3>
            {membros.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum membro cadastrado.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {[...membros]
                  .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                  .map((m) => (
                  <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={selectedMembros.includes(m.id)} onCheckedChange={() => toggleMembro(m.id)} />
                    <span className="text-foreground">{m.nome}</span>
                    <span className="text-muted-foreground text-xs">({m.ministerio})</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Reforços */}
          <div className="glass-card rounded-xl p-5">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={incluirReforcos} onCheckedChange={(v) => setIncluirReforcos(!!v)} />
              <span className="font-semibold font-display text-foreground">Incluir Reforços Agendados</span>
              <span className="text-sm text-muted-foreground">({reforcos.length})</span>
            </label>
          </div>

          {/* Eventos */}
          <div className="glass-card rounded-xl p-5">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={incluirEventos} onCheckedChange={(v) => setIncluirEventos(!!v)} />
              <span className="font-semibold font-display text-foreground">Incluir Eventos Agendados</span>
              <span className="text-sm text-muted-foreground">({eventos.length})</span>
            </label>
          </div>
        </div>
      )}

      {/* ABA: FILTROS */}
      {aba === 'filtros' && (
        <div className="space-y-6">
          {/* Período */}
          <div className="glass-card rounded-xl p-5 space-y-4">
            <h3 className="font-semibold font-display text-foreground">Período</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm mb-2 block">Data Início (opcional)</Label>
                <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
              </div>
              <div>
                <Label className="text-sm mb-2 block">Data Fim (opcional)</Label>
                <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
              </div>
            </div>
            {(dataInicio || dataFim) && (
              <p className="text-xs text-muted-foreground pt-2">
                Filtro ativo: {dataInicio ? new Date(dataInicio + 'T12:00:00').toLocaleDateString('pt-BR') : '—'} a{' '}
                {dataFim ? new Date(dataFim + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
              </p>
            )}
          </div>

          {/* Tipos de Reuniões */}
          {incluirEventos && (
            <div className="glass-card rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold font-display text-foreground">Tipos de Reuniões</h3>
                {filtroTiposReunioes.length > 0 && (
                  <Badge variant="secondary" className="text-xs">{filtroTiposReunioes.length} selecionados</Badge>
                )}
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {tiposReunioesDisponiveis.map((tipo) => (
                  <label key={tipo} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={filtroTiposReunioes.includes(tipo)}
                      onCheckedChange={() => toggleFiltroTipoReuniao(tipo)}
                    />
                    <span className="text-foreground">{tipo}</span>
                  </label>
                ))}
              </div>
              {filtroTiposReunioes.length > 0 && (
                <Button
                  onClick={() => setFiltroTiposReunioes([])}
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                >
                  Limpar Filtro de Reuniões
                </Button>
              )}
            </div>
          )}

          {/* Tipos de Eventos */}
          {incluirEventos && (
            <div className="glass-card rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold font-display text-foreground">Tipos de Eventos</h3>
                {filtroTiposEventos.length > 0 && (
                  <Badge variant="secondary" className="text-xs">{filtroTiposEventos.length} selecionados</Badge>
                )}
              </div>
              <div className="space-y-2">
                {tiposEventosDisponiveis.map((tipo) => (
                  <label key={tipo} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={filtroTiposEventos.includes(tipo)}
                      onCheckedChange={() => toggleFiltroTipoEvento(tipo)}
                    />
                    <span className="text-foreground">{tipo}</span>
                  </label>
                ))}
              </div>
              {filtroTiposEventos.length > 0 && (
                <Button
                  onClick={() => setFiltroTiposEventos([])}
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                >
                  Limpar Filtro de Eventos
                </Button>
              )}
            </div>
          )}

          {/* Tipos de Reforços */}
          {incluirReforcos && (
            <div className="glass-card rounded-xl p-5 space-y-3">
              <h3 className="font-semibold font-display text-foreground">Tipos de Reforços</h3>
              <div className="space-y-2">
                {tiposReforcoDisponiveis.map((tipo) => (
                  <label key={tipo} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox defaultChecked disabled />
                    <span className="text-foreground">{tipo}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Todos os tipos de reforço estão inclusos</p>
            </div>
          )}

          {/* Botão para limpar todos os filtros */}
          {(filtroTiposReunioes.length > 0 || filtroTiposEventos.length > 0 || dataInicio || dataFim) && (
            <Button
              onClick={() => {
                setFiltroTiposReunioes([]);
                setFiltroTiposEventos([]);
                setDataInicio('');
                setDataFim('');
              }}
              variant="outline"
              className="w-full gap-2"
            >
              <Settings className="h-4 w-4" /> Limpar Todos os Filtros
            </Button>
          )}
        </div>
      )}

      {/* ABA: PREVIEW */}
      {/* ABA: PREVIEW */}
      {aba === 'preview' && (
        <div className="space-y-6">
          {/* Botões de Ação */}
          <div className="flex gap-2">
            <Button onClick={gerarPDF} disabled={!hasSelection} className="gap-2">
              <Download className="h-4 w-4" /> Gerar PDF e Baixar
            </Button>
            <Button onClick={gerarXLS} disabled={!hasSelection} className="gap-2 bg-green-600 hover:bg-green-700">
              <Download className="h-4 w-4" /> Gerar XLS
            </Button>
            <Button onClick={salvarLista} className="gap-2">
              <FileText className="h-4 w-4" /> Salvar Lista
            </Button>
          </div>

          {/* Preview Section */}
          <div ref={previewRefEditor} className="glass-card rounded-xl p-8 space-y-6 bg-white" style={{ fontFamily: "'Calibri', 'Arial', 'Trebuchet MS', sans-serif" }}>
          {/* Cabeçalho do Documento */}
          <div className="text-center space-y-2 pb-4 border-b-2 border-gray-800">
            <div className="text-sm font-semibold">CONGREGAÇÃO CRISTÃ</div>
            <div className="text-sm font-semibold">NO</div>
            <div className="text-sm font-semibold">BRASIL</div>
            <div className="text-lg font-bold mt-3">LISTA DE BATISMOS E DIVERSOS</div>
            <div className="text-sm font-semibold mt-2">ADMINISTRAÇÃO ITUIUTABA</div>
            {(dataInicio || dataFim) && (
              <div className="text-xs font-semibold mt-1">
                {dataInicio ? new Date(dataInicio + 'T12:00:00').toLocaleDateString('pt-BR') : 'Início'} A {dataFim ? new Date(dataFim + 'T12:00:00').toLocaleDateString('pt-BR') : 'Fim'}
              </div>
            )}
          </div>

          {/* Tabelas por tipo de evento */}
          <div className="space-y-6">
            {/* TODOS OS EVENTOS AGENDADOS */}
            {incluirEventos && getEventosFiltrados().length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-center pb-2 border-b border-gray-400">TODOS OS EVENTOS AGENDADOS</h4>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-300 border border-gray-900">
                      <td className={`border border-gray-900 ${getPaddingClass()} ${getFontWeightClass()} text-left ${getFontSizeClass()} text-gray-900 break-words`}>DATA</td>
                      <td className={`border border-gray-900 ${getPaddingClass()} ${getFontWeightClass()} text-center ${getFontSizeClass()} text-gray-900 break-words`}>HORA</td>
                      <td className={`border border-gray-900 ${getPaddingClass()} ${getFontWeightClass()} text-left ${getFontSizeClass()} text-gray-900 break-words`}>TIPO</td>
                      <td className={`border border-gray-900 ${getPaddingClass()} ${getFontWeightClass()} text-left ${getFontSizeClass()} text-gray-900 break-words`}>LOCALIDADE</td>
                      <td className={`border border-gray-900 ${getPaddingClass()} ${getFontWeightClass()} text-left ${getFontSizeClass()} text-gray-900 break-words`}>IRMÃO</td>
                    </tr>
                  </thead>
                  <tbody>
                    {getEventosFiltrados()
                      .map((e) => {
                        const dataObj = new Date(e.data + 'T12:00:00');
                        const diasSemana = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
                        const dataBR = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                        const diaSemana = diasSemana[dataObj.getDay()];
                        return (
                          <tr key={e.id} className="border border-gray-900 bg-white">
                            <td className={`border border-gray-900 ${getPaddingClass()} ${getFontSizeClass()} text-gray-900 break-words`}>{dataBR} {diaSemana}</td>
                            <td className={`border border-gray-900 ${getPaddingClass()} text-center ${getFontSizeClass()} text-gray-900 break-words`}>{e.horario || '—'}</td>
                            <td className={`border border-gray-900 ${getPaddingClass()} ${getFontSizeClass()} text-gray-900 break-words`}>{e.subtipoReuniao || e.tipo || '—'}</td>
                            <td className={`border border-gray-900 ${getPaddingClass()} ${getFontSizeClass()} text-gray-900 break-words`}>{getCongregacaoNome(e.congregacaoId) || '—'}</td>
                            <td className={`border border-gray-900 ${getPaddingClass()} ${getFontSizeClass()} text-gray-900 break-words`}>{reduzirNome(e.anciaoAtende || '—')}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}

            {/* BATISMO */}
            {incluirEventos && getEventosFiltrados().filter(e => e.subtipoReuniao === 'Batismo').length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-center pb-2 border-b border-gray-400">BATISMO</h4>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-300 border border-gray-900">
                      <th className={`border border-gray-900 ${getPaddingClass()} ${getFontWeightClass()} text-left ${getFontSizeClass()} text-gray-900 break-words`}>DATA</th>
                      <th className={`border border-gray-900 ${getPaddingClass()} ${getFontWeightClass()} text-center ${getFontSizeClass()} text-gray-900 break-words`}>HORA</th>
                      <th className={`border border-gray-900 ${getPaddingClass()} ${getFontWeightClass()} text-left ${getFontSizeClass()} text-gray-900 break-words`}>LOCALIDADE</th>
                      <th className={`border border-gray-900 ${getPaddingClass()} ${getFontWeightClass()} text-left ${getFontSizeClass()} text-gray-900 break-words`}>ANCIÃO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getEventosFiltrados()
                      .filter(e => e.subtipoReuniao === 'Batismo')
                      .map((e) => {
                        const dataObj = new Date(e.data + 'T12:00:00');
                        const diasSemana = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
                        const dataBR = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                        const diaSemana = diasSemana[dataObj.getDay()];
                        return (
                          <tr key={e.id} className="border border-gray-900 bg-white">
                            <td className={`border border-gray-900 ${getPaddingClass()} ${getFontSizeClass()} text-gray-900 break-words`}>{dataBR} {diaSemana}</td>
                            <td className={`border border-gray-900 ${getPaddingClass()} text-center ${getFontSizeClass()} text-gray-900 break-words`}>{e.horario || '—'}</td>
                            <td className={`border border-gray-900 ${getPaddingClass()} ${getFontSizeClass()} text-gray-900 break-words`}>{getCongregacaoNome(e.congregacaoId) || '—'}</td>
                            <td className={`border border-gray-900 ${getPaddingClass()} ${getFontSizeClass()} text-gray-900 break-words`}>{reduzirNome(e.anciaoAtende || '—')}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}

            {/* SANTA-CEIA */}
            {incluirEventos && getEventosFiltrados().filter(e => e.subtipoReuniao === 'Santa-Ceia').length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-center pb-2 border-b border-gray-400">SANTA-CEIA</h4>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-300 border border-gray-900">
                      <th className={`border border-gray-900 ${getPaddingClass()} ${getFontWeightClass()} text-left ${getFontSizeClass()} text-gray-900 break-words`}>DATA</th>
                      <th className={`border border-gray-900 ${getPaddingClass()} ${getFontWeightClass()} text-center ${getFontSizeClass()} text-gray-900 break-words`}>HORA</th>
                      <th className={`border border-gray-900 ${getPaddingClass()} ${getFontWeightClass()} text-left ${getFontSizeClass()} text-gray-900 break-words`}>LOCALIDADE</th>
                      <th className={`border border-gray-900 ${getPaddingClass()} ${getFontWeightClass()} text-left ${getFontSizeClass()} text-gray-900 break-words`}>ANCIÃO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getEventosFiltrados()
                      .filter(e => e.subtipoReuniao === 'Santa-Ceia')
                      .map((e) => {
                        const dataObj = new Date(e.data + 'T12:00:00');
                        const diasSemana = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
                        const dataBR = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                        const diaSemana = diasSemana[dataObj.getDay()];
                        return (
                          <tr key={e.id} className="border border-gray-900 bg-white">
                            <td className={`border border-gray-900 ${getPaddingClass()} ${getFontSizeClass()} text-gray-900 break-words`}>{dataBR} {diaSemana}</td>
                            <td className={`border border-gray-900 ${getPaddingClass()} text-center ${getFontSizeClass()} text-gray-900 break-words`}>{e.horario || '—'}</td>
                            <td className={`border border-gray-900 ${getPaddingClass()} ${getFontSizeClass()} text-gray-900 break-words`}>{getCongregacaoNome(e.congregacaoId) || '—'}</td>
                            <td className={`border border-gray-900 ${getPaddingClass()} ${getFontSizeClass()} text-gray-900 break-words`}>{reduzirNome(e.anciaoAtende || '—')}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}

            {/* REFORÇO - CULTO OFICIAL */}
            {incluirReforcos && getReforcosFiltrados().filter(r => r.tipo === 'Culto').length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-center pb-2 border-b border-gray-400">REFORÇO - CULTO OFICIAL</h4>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-300 border border-gray-900">
                      <th className={`border border-gray-900 ${getPaddingClass()} ${getFontWeightClass()} text-left ${getFontSizeClass()} text-gray-900 break-words`}>DATA</th>
                      <th className={`border border-gray-900 ${getPaddingClass()} ${getFontWeightClass()} text-center ${getFontSizeClass()} text-gray-900 break-words`}>HORA</th>
                      <th className={`border border-gray-900 ${getPaddingClass()} ${getFontWeightClass()} text-left ${getFontSizeClass()} text-gray-900 break-words`}>LOCALIDADE</th>
                      <th className={`border border-gray-900 ${getPaddingClass()} ${getFontWeightClass()} text-left ${getFontSizeClass()} text-gray-900 break-words`}>IRMÃO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getReforcosFiltrados()
                      .filter(r => r.tipo === 'Culto')
                      .map((r) => {
                        const dataObj = new Date(r.data + 'T12:00:00');
                        const diasSemana = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
                        const dataBR = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                        const diaSemana = diasSemana[dataObj.getDay()];
                        return (
                          <tr key={r.id} className="border border-gray-900 bg-white">
                            <td className={`border border-gray-900 ${getPaddingClass()} ${getFontSizeClass()} text-gray-900 break-words`}>{dataBR} {diaSemana}</td>
                            <td className={`border border-gray-900 ${getPaddingClass()} text-center ${getFontSizeClass()} text-gray-900 break-words`}>{r.horario || '—'}</td>
                            <td className={`border border-gray-900 ${getPaddingClass()} ${getFontSizeClass()} text-gray-900 break-words`}>{getCongregacaoNome(r.congregacaoId) || '—'}</td>
                            <td className={`border border-gray-900 ${getPaddingClass()} ${getFontSizeClass()} text-gray-900 break-words`}>{r.membros.length > 0 ? r.membros.map((id) => reduzirNome(membros.find((m) => m.id === id)?.nome || '—')).join(', ') : '—'}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}

            {/* REFORÇO - RJM */}
            {incluirReforcos && getReforcosFiltrados().filter(r => r.tipo === 'RJM').length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-center pb-2 border-b border-gray-400">REFORÇO - RJM</h4>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-300 border border-gray-900">
                      <th className={`border border-gray-900 ${getPaddingClass()} ${getFontWeightClass()} text-left ${getFontSizeClass()} text-gray-900 break-words`}>DATA</th>
                      <th className={`border border-gray-900 ${getPaddingClass()} ${getFontWeightClass()} text-center ${getFontSizeClass()} text-gray-900 break-words`}>HORA</th>
                      <th className={`border border-gray-900 ${getPaddingClass()} ${getFontWeightClass()} text-left ${getFontSizeClass()} text-gray-900 break-words`}>LOCALIDADE</th>
                      <th className={`border border-gray-900 ${getPaddingClass()} ${getFontWeightClass()} text-left ${getFontSizeClass()} text-gray-900 break-words`}>IRMÃO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getReforcosFiltrados()
                      .filter(r => r.tipo === 'RJM')
                      .map((r) => {
                        const dataObj = new Date(r.data + 'T12:00:00');
                        const diasSemana = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
                        const dataBR = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                        const diaSemana = diasSemana[dataObj.getDay()];
                        return (
                          <tr key={r.id} className="border border-gray-900 bg-white">
                            <td className={`border border-gray-900 ${getPaddingClass()} ${getFontSizeClass()} text-gray-900 break-words`}>{dataBR} {diaSemana}</td>
                            <td className={`border border-gray-900 ${getPaddingClass()} text-center ${getFontSizeClass()} text-gray-900 break-words`}>{r.horario || '—'}</td>
                            <td className={`border border-gray-900 ${getPaddingClass()} ${getFontSizeClass()} text-gray-900 break-words`}>{getCongregacaoNome(r.congregacaoId) || '—'}</td>
                            <td className={`border border-gray-900 ${getPaddingClass()} ${getFontSizeClass()} text-gray-900 break-words`}>{r.membros.length > 0 ? r.membros.map((id) => reduzirNome(membros.find((m) => m.id === id)?.nome || '—')).join(', ') : '—'}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}

            {incluirEventos && getEventosFiltrados().length === 0 && incluirReforcos && getReforcosFiltrados().length === 0 && (
              <p className="text-sm text-muted-foreground text-center">Nenhum evento ou reforço no período selecionado.</p>
            )}
          </div>
          </div>
        </div>
      )}
    </div>
    );
  }

  return null;
}
