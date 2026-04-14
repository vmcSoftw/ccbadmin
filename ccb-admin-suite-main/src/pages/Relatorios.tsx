import { useState } from 'react';
import { Download, Filter } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useEventos, useReforcos, useMembros, useCongregacoes } from '@/hooks/useData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export default function Relatorios() {
  const { eventos } = useEventos();
  const { reforcos } = useReforcos();
  const { congregacoes } = useCongregacoes();
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filterType, setFilterType] = useState('Todos');
  const [filterCongregacao, setFilterCongregacao] = useState('Todas');

  // Filtrar dados baseado nos filtros
  const filteredEventos = eventos.filter((e) => {
    const eventMonth = e.data.slice(0, 7);
    const monthMatch = eventMonth === filterMonth;
    const typeMatch = filterType === 'Todos' || e.tipo === filterType;
    const congMatch = filterCongregacao === 'Todas' || e.congregacaoId === filterCongregacao;
    return monthMatch && typeMatch && congMatch;
  });

  const filteredReforcos = reforcos.filter((r) => {
    const refMonth = r.data.slice(0, 7);
    const monthMatch = refMonth === filterMonth;
    const typeMatch = filterType === 'Todos' || r.tipo === filterType;
    const congMatch = filterCongregacao === 'Todas' || r.congregacaoId === filterCongregacao;
    return monthMatch && typeMatch && congMatch;
  });

  // Gráfico 1: Eventos por tipo
  const eventosPorTipo = [
    { nome: 'Culto', valor: filteredEventos.filter((e) => e.tipo === 'Culto').length },
    { nome: 'RJM', valor: filteredEventos.filter((e) => e.tipo === 'RJM').length },
    { nome: 'Ensaio', valor: filteredEventos.filter((e) => e.tipo === 'Ensaio').length },
    { nome: 'Reunião', valor: filteredEventos.filter((e) => e.tipo === 'Reunião').length },
    { nome: 'Jovens', valor: filteredEventos.filter((e) => e.tipo === 'Jovens').length },
    { nome: 'Outro', valor: filteredEventos.filter((e) => e.tipo === 'Outro').length },
  ].filter((item) => item.valor > 0);

  // Gráfico 2: Reforços por tipo
  const reforcosPorTipo = [
    { nome: 'Culto', valor: filteredReforcos.filter((r) => r.tipo === 'Culto').length },
    { nome: 'RJM', valor: filteredReforcos.filter((r) => r.tipo === 'RJM').length },
  ].filter((item) => item.valor > 0);

  // Gráfico 3: Eventos por congregação
  const eventosPorCong = congregacoes
    .map((cong) => ({
      nome: cong.nome.split(' ')[0],
      eventos: filteredEventos.filter((e) => e.congregacaoId === cong.id).length,
      reforcos: filteredReforcos.filter((r) => r.congregacaoId === cong.id).length,
    }))
    .filter((item) => item.eventos > 0 || item.reforcos > 0);

  // Gráfico 4: Evolução de eventos por semana
  const semanas: Record<string, { semana: string; eventos: number; reforcos: number }> = {};
  filteredEventos.forEach((e) => {
    const date = new Date(e.data);
    const semana = `Sem ${Math.ceil((date.getDate()) / 7)}`;
    if (!semanas[semana]) semanas[semana] = { semana, eventos: 0, reforcos: 0 };
    semanas[semana].eventos++;
  });
  filteredReforcos.forEach((r) => {
    const date = new Date(r.data);
    const semana = `Sem ${Math.ceil(date.getDate() / 7)}`;
    if (!semanas[semana]) semanas[semana] = { semana, eventos: 0, reforcos: 0 };
    semanas[semana].reforcos++;
  });
  const evolucaoSemanas = Object.values(semanas).sort((a, b) => 
    parseInt(a.semana.split(' ')[1]) - parseInt(b.semana.split(' ')[1])
  );

  const COLORS = ['#1e79db', '#5da3f0', '#90c0f9', '#c0daf9', '#1a5ba8', '#0a2d60'];

  const exportToPDF = async () => {
    const reportElement = document.getElementById('reportContent');
    if (!reportElement) return;

    try {
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const image = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageHeight = pdf.internal.pageSize.getHeight();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(image, 'PNG', 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(image, 'PNG', 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const date = new Date(filterMonth);
      const fileName = `Relatorio_${meses[date.getMonth()]}_${date.getFullYear()}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-sm text-muted-foreground mt-1">Análise de eventos e reforços</p>
        </div>
        <Button onClick={exportToPDF} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar PDF
        </Button>
      </div>

      {/* Filtros */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Período</Label>
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            />
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                <SelectItem value="Culto">Culto</SelectItem>
                <SelectItem value="RJM">RJM</SelectItem>
                <SelectItem value="Ensaio">Ensaio</SelectItem>
                <SelectItem value="Reunião">Reunião</SelectItem>
                <SelectItem value="Jovens">Jovens</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Congregação</Label>
            <Select value={filterCongregacao} onValueChange={setFilterCongregacao}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas</SelectItem>
                {congregacoes.map((cong) => (
                  <SelectItem key={cong.id} value={cong.id}>
                    {cong.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">Total de Eventos</p>
              <p className="text-3xl font-bold text-primary mt-2">{filteredEventos.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">Total de Reforços</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{filteredReforcos.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">Congregações</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {new Set([...filteredEventos, ...filteredReforcos].map((e) => e.congregacaoId)).size}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">Total Geral</p>
              <p className="text-3xl font-bold text-gray-600 mt-2">{filteredEventos.length + filteredReforcos.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo para PDF */}
      <div id="reportContent" className="space-y-6 bg-white p-6">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-black">Relatório de Eventos e Reforços</h2>
          <p className="text-gray-600 text-sm mt-1">Período: {filterMonth}</p>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico 1: Eventos por Tipo */}
          {eventosPorTipo.length > 0 && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Eventos por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={eventosPorTipo}
                      dataKey="valor"
                      nameKey="nome"
                      cx="50%"
                      cy="50%"
                      labelLine
                      label={({ nome, valor }) => `${nome}: ${valor}`}
                    >
                      {eventosPorTipo.map((_, i) => (
                        <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Gráfico 2: Reforços por Tipo */}
          {reforcosPorTipo.length > 0 && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Reforços por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reforcosPorTipo}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nome" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="valor" fill="#1e79db" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Gráfico 3: Comparativo por Congregação */}
        {eventosPorCong.length > 0 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Atividades por Congregação</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={eventosPorCong}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="eventos" fill="#1e79db" name="Eventos" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="reforcos" fill="#5da3f0" name="Reforços" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Gráfico 4: Evolução por Semana */}
        {evolucaoSemanas.length > 0 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Evolução por Semana</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={evolucaoSemanas}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="semana" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="eventos" stroke="#1e79db" name="Eventos" strokeWidth={2} />
                  <Line type="monotone" dataKey="reforcos" stroke="#5da3f0" name="Reforços" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Resumo */}
        <Card className="border-border mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Resumo do Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-gray-600 text-sm">Total de Eventos</p>
                <p className="text-2xl font-bold text-black mt-1">{filteredEventos.length}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total de Reforços</p>
                <p className="text-2xl font-bold text-black mt-1">{filteredReforcos.length}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Geral</p>
                <p className="text-2xl font-bold text-black mt-1">{filteredEventos.length + filteredReforcos.length}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Congregações</p>
                <p className="text-2xl font-bold text-black mt-1">
                  {new Set([...filteredEventos, ...filteredReforcos].map((e) => e.congregacaoId)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
