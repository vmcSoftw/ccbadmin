import { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload, Trash2, Eye, DollarSign, Building2, MapPin,
  ChevronLeft, FileSpreadsheet,
} from 'lucide-react';
import { useColetas } from '@/hooks/useData';
import type { ColetaUpload } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function parseNum(v: unknown): number {
  if (typeof v === 'number') return isNaN(v) ? 0 : v;
  if (typeof v === 'string') {
    const c = v.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.').trim();
    const n = parseFloat(c);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function autoDetect(headers: string[], rows: Record<string, unknown>[]) {
  const congPatterns = ['congregac', 'igreja', 'localidade'];
  const cidadePatterns = ['cidade', 'municipio', 'city'];

  const congCol =
    headers.find(h => congPatterns.some(p => normalize(h).includes(p))) ||
    headers[0] ||
    '';
  const cidadeCol =
    headers.find(h => cidadePatterns.some(p => normalize(h).includes(p))) ||
    headers.find(h => h !== congCol) ||
    '';

  const valorCols = headers.filter(h => {
    if (h === congCol || h === cidadeCol) return false;
    const nonEmpty = rows.filter(r => r[h] !== '' && r[h] != null);
    if (nonEmpty.length === 0) return false;
    const numeric = nonEmpty.filter(r => {
      const n = parseNum(r[h]);
      return n !== 0;
    }).length;
    return numeric / nonEmpty.length > 0.4;
  });

  return { congCol, cidadeCol, valorCols };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Administracao() {
  const { coletas, adicionar: adicionarColeta, remover: removerColeta } = useColetas();

  // Detail view
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [viewDetailTab, setViewDetailTab] = useState('igrejas');

  // Import dialog
  const [importOpen, setImportOpen] = useState(false);
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<Record<string, unknown>[]>([]);
  const [mappingCong, setMappingCong] = useState('');
  const [mappingCidade, setMappingCidade] = useState('');
  const [mappingValorCols, setMappingValorCols] = useState<string[]>([]);
  const [importDescricao, setImportDescricao] = useState('');
  const [importDataRef, setImportDataRef] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; descricao: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File parse ──────────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
        if (raw.length === 0) return;
        const headers = Object.keys(raw[0]);
        setParsedHeaders(headers);
        setParsedRows(raw);
        const { congCol, cidadeCol, valorCols } = autoDetect(headers, raw);
        setMappingCong(congCol);
        setMappingCidade(cidadeCol);
        setMappingValorCols(valorCols);
        setImportOpen(true);
      } catch {
        alert('Erro ao ler o arquivo. Verifique se é um xlsx/xls válido.');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // ── Save import ─────────────────────────────────────────────────────────────

  const handleSaveImport = async () => {
    if (!parsedRows.length || !mappingCong) return;
    setSaving(true);
    try {
      const linhas = parsedRows
        .map(row => {
          const l: Record<string, string | number> = {
            congregacao: String(row[mappingCong] ?? ''),
            cidade: mappingCidade && mappingCidade !== '__none__'
              ? String(row[mappingCidade] ?? '')
              : '',
          };
          for (const col of mappingValorCols) {
            l[col] = parseNum(row[col]);
          }
          return l;
        })
        .filter(l => String(l.congregacao).trim() !== '');

      await adicionarColeta({
        descricao: importDescricao.trim() || 'Mapa de Coletas',
        dataReferencia: importDataRef.trim(),
        uploadedAt: new Date().toISOString(),
        colunas: [mappingCong, mappingCidade, ...mappingValorCols].filter(Boolean),
        colunasValor: mappingValorCols,
        linhas,
      });

      setImportOpen(false);
      setParsedRows([]);
      setParsedHeaders([]);
      setImportDescricao('');
      setImportDataRef('');
    } finally {
      setSaving(false);
    }
  };

  // ── Aggregations ────────────────────────────────────────────────────────────

  const viewingColeta = useMemo(
    () => coletas.find(c => c.id === viewingId) ?? null,
    [coletas, viewingId],
  );

  const aggs = useMemo(() => {
    if (!viewingColeta) return null;

    const porIgreja = viewingColeta.linhas.map(linha => {
      const total = viewingColeta.colunasValor.reduce(
        (s, col) => s + parseNum(linha[col]),
        0,
      );
      const detalhes: Record<string, number> = {};
      for (const col of viewingColeta.colunasValor) {
        detalhes[col] = parseNum(linha[col]);
      }
      return { nome: String(linha.congregacao), cidade: String(linha.cidade), total, detalhes };
    });
    porIgreja.sort((a, b) => b.total - a.total);

    const cidadeMap: Record<string, number> = {};
    for (const ig of porIgreja) {
      cidadeMap[ig.cidade || '—'] = (cidadeMap[ig.cidade || '—'] || 0) + ig.total;
    }
    const cidadesArr = Object.entries(cidadeMap).sort((a, b) => b[1] - a[1]);
    const totalGeral = porIgreja.reduce((s, ig) => s + ig.total, 0);

    return { porIgreja, cidadesArr, totalGeral };
  }, [viewingColeta]);

  // ── DETAIL VIEW ─────────────────────────────────────────────────────────────

  if (viewingColeta && aggs) {
    return (
      <div className="space-y-6">
        {/* Back + title */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setViewingId(null)}>
            <ChevronLeft className="h-4 w-4 mr-1" />Voltar
          </Button>
          <div>
            <h1 className="text-xl font-bold">{viewingColeta.descricao}</h1>
            {viewingColeta.dataReferencia && (
              <p className="text-sm text-muted-foreground">{viewingColeta.dataReferencia}</p>
            )}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30 flex-shrink-0">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Geral</p>
                <p className="text-lg font-bold text-green-700">{formatBRL(aggs.totalGeral)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Igrejas</p>
                <p className="text-lg font-bold">{viewingColeta.linhas.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30 flex-shrink-0">
                <MapPin className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cidades</p>
                <p className="text-lg font-bold">{aggs.cidadesArr.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={viewDetailTab} onValueChange={setViewDetailTab}>
          <TabsList>
            <TabsTrigger value="igrejas">Por Igreja</TabsTrigger>
            <TabsTrigger value="cidades">Por Cidade</TabsTrigger>
            <TabsTrigger value="grafico">Gráfico</TabsTrigger>
          </TabsList>

          {/* Por Igreja */}
          <TabsContent value="igrejas" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-medium">#</th>
                        <th className="text-left p-3 font-medium">Congregação</th>
                        <th className="text-left p-3 font-medium">Cidade</th>
                        {viewingColeta.colunasValor.map(col => (
                          <th key={col} className="text-right p-3 font-medium">{col}</th>
                        ))}
                        <th className="text-right p-3 font-medium text-green-700">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aggs.porIgreja.map((ig, i) => (
                        <tr key={i} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="p-3 text-muted-foreground text-xs">{i + 1}</td>
                          <td className="p-3 font-medium">{ig.nome}</td>
                          <td className="p-3 text-muted-foreground">{ig.cidade || '—'}</td>
                          {viewingColeta.colunasValor.map(col => (
                            <td key={col} className="p-3 text-right text-muted-foreground">
                              {formatBRL(ig.detalhes[col] ?? 0)}
                            </td>
                          ))}
                          <td className="p-3 text-right font-semibold text-green-700">
                            {formatBRL(ig.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 bg-muted/30 font-bold">
                        <td colSpan={3} className="p-3">TOTAL GERAL</td>
                        {viewingColeta.colunasValor.map(col => (
                          <td key={col} className="p-3 text-right">
                            {formatBRL(aggs.porIgreja.reduce((s, ig) => s + (ig.detalhes[col] ?? 0), 0))}
                          </td>
                        ))}
                        <td className="p-3 text-right text-green-700">{formatBRL(aggs.totalGeral)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Por Cidade */}
          <TabsContent value="cidades" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-medium">#</th>
                        <th className="text-left p-3 font-medium">Cidade</th>
                        <th className="text-right p-3 font-medium">Igrejas</th>
                        <th className="text-right p-3 font-medium text-green-700">Total</th>
                        <th className="text-right p-3 font-medium">% do Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aggs.cidadesArr.map(([cidade, total], i) => {
                        const numIgrejas = viewingColeta.linhas.filter(
                          l => (String(l.cidade) || '—') === cidade,
                        ).length;
                        const pct =
                          aggs.totalGeral > 0
                            ? ((total / aggs.totalGeral) * 100).toFixed(1)
                            : '0.0';
                        return (
                          <tr key={cidade} className="border-b hover:bg-muted/30 transition-colors">
                            <td className="p-3 text-muted-foreground text-xs">{i + 1}</td>
                            <td className="p-3 font-medium">{cidade}</td>
                            <td className="p-3 text-right text-muted-foreground">{numIgrejas}</td>
                            <td className="p-3 text-right font-semibold text-green-700">
                              {formatBRL(total)}
                            </td>
                            <td className="p-3 text-right text-muted-foreground">{pct}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 bg-muted/30 font-bold">
                        <td colSpan={2} className="p-3">TOTAL</td>
                        <td className="p-3 text-right">{viewingColeta.linhas.length}</td>
                        <td className="p-3 text-right text-green-700">{formatBRL(aggs.totalGeral)}</td>
                        <td className="p-3 text-right">100%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gráfico */}
          <TabsContent value="grafico" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Coleta por Cidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={aggs.cidadesArr.map(([name, value]) => ({ name, value }))}
                    margin={{ top: 5, right: 20, left: 30, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-40}
                      textAnchor="end"
                      tick={{ fontSize: 11 }}
                      interval={0}
                    />
                    <YAxis
                      tickFormatter={(v: number) =>
                        v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`
                      }
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip formatter={(v: number) => [formatBRL(v), 'Coleta']} />
                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} name="Coleta" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Top 10 Congregações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={aggs.porIgreja.slice(0, 10).map(ig => ({
                      name: ig.nome.length > 20 ? ig.nome.slice(0, 20) + '…' : ig.nome,
                      value: ig.total,
                    }))}
                    margin={{ top: 5, right: 20, left: 30, bottom: 90 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      tick={{ fontSize: 10 }}
                      interval={0}
                    />
                    <YAxis
                      tickFormatter={(v: number) =>
                        v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`
                      }
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip formatter={(v: number) => [formatBRL(v), 'Coleta']} />
                    <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Coleta" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // ── LIST VIEW ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <Tabs defaultValue="tesouraria">
        <TabsList>
          <TabsTrigger value="tesouraria">
            <DollarSign className="h-4 w-4 mr-1.5" />
            Tesouraria
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tesouraria" className="mt-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold">Mapas de Coletas</h2>
              <p className="text-sm text-muted-foreground">
                Importe planilhas e visualize os resultados por igreja e por cidade
              </p>
            </div>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Importar Planilha
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileChange}
          />

          {coletas.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-14 text-center">
                <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="font-medium text-muted-foreground">
                  Nenhuma planilha importada ainda.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Clique em "Importar Planilha" para adicionar um mapa de coletas.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {coletas
                .slice()
                .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
                .map(coleta => {
                  const totalGeral = coleta.linhas.reduce(
                    (s, l) =>
                      s + coleta.colunasValor.reduce((vs, col) => vs + parseNum(l[col]), 0),
                    0,
                  );
                  const numCidades = new Set(
                    coleta.linhas.map(l => l.cidade).filter(Boolean),
                  ).size;
                  return (
                    <Card key={coleta.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex-shrink-0">
                          <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{coleta.descricao}</p>
                          <div className="flex flex-wrap items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                            {coleta.dataReferencia && (
                              <span>{coleta.dataReferencia}</span>
                            )}
                            <span>{coleta.linhas.length} igrejas</span>
                            {numCidades > 0 && <span>{numCidades} cidades</span>}
                            <span className="font-semibold text-green-700">
                              {formatBRL(totalGeral)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setViewingId(coleta.id);
                              setViewDetailTab('igrejas');
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setDeleteTarget({ id: coleta.id, descricao: coleta.descricao })
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Import Dialog ───────────────────────────────────────────────────── */}
      <Dialog
        open={importOpen}
        onOpenChange={(o) => {
          if (!o) {
            setImportOpen(false);
            setParsedRows([]);
            setParsedHeaders([]);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar Planilha de Coletas</DialogTitle>
            <DialogDescription>
              Configure o mapeamento de colunas antes de salvar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Description + reference */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Descrição</Label>
                <Input
                  placeholder="ex: Mapa de Coletas Abril/2026"
                  value={importDescricao}
                  onChange={e => setImportDescricao(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Referência (mês/ano)</Label>
                <Input
                  placeholder="ex: Abril/2026"
                  value={importDataRef}
                  onChange={e => setImportDataRef(e.target.value)}
                />
              </div>
            </div>

            {/* Column mapping */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Coluna: Congregação *</Label>
                <Select value={mappingCong} onValueChange={setMappingCong}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {parsedHeaders.map(h => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Coluna: Cidade</Label>
                <Select value={mappingCidade} onValueChange={setMappingCidade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Nenhuma —</SelectItem>
                    {parsedHeaders.map(h => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Value columns checkboxes */}
            <div className="space-y-1.5">
              <Label>Colunas de Valor (coletas)</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border rounded-lg p-3 max-h-40 overflow-y-auto bg-muted/30">
                {parsedHeaders
                  .filter(h => h !== mappingCong && h !== mappingCidade && h !== '__none__')
                  .map(h => (
                    <label key={h} className="flex items-center gap-2 cursor-pointer select-none">
                      <Checkbox
                        checked={mappingValorCols.includes(h)}
                        onCheckedChange={checked => {
                          if (checked) setMappingValorCols(prev => [...prev, h]);
                          else setMappingValorCols(prev => prev.filter(c => c !== h));
                        }}
                      />
                      <span className="text-sm truncate" title={h}>{h}</span>
                    </label>
                  ))}
              </div>
            </div>

            {/* Preview */}
            {parsedRows.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">
                  Prévia — {parsedRows.length} linhas detectadas
                </Label>
                <div className="overflow-x-auto border rounded-lg max-h-44 bg-background">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        {[
                          mappingCong,
                          mappingCidade !== '__none__' ? mappingCidade : null,
                          ...mappingValorCols,
                        ]
                          .filter(Boolean)
                          .map(h => (
                            <th key={h} className="text-left p-2 font-medium whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.slice(0, 6).map((row, i) => (
                        <tr key={i} className="border-b">
                          {[
                            mappingCong,
                            mappingCidade !== '__none__' ? mappingCidade : null,
                            ...mappingValorCols,
                          ]
                            .filter((h): h is string => Boolean(h))
                            .map(h => (
                              <td key={h} className="p-2 whitespace-nowrap">
                                {String(row[h] ?? '')}
                              </td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setImportOpen(false);
                setParsedRows([]);
                setParsedHeaders([]);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveImport} disabled={saving || !mappingCong}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Dialog ───────────────────────────────────────────────────── */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={o => {
          if (!o) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir "{deleteTarget?.descricao}"? Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!deleteTarget) return;
                await removerColeta(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
