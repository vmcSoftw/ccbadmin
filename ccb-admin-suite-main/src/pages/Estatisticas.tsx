import { useMemo, useState, useRef } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  useResultadosBatismo,
  useResultadosSantaCeia,
  useResultadosEnsaioRegional,
  useCongregacoes,
} from '@/hooks/useData';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Droplets, Users, Music, Award, BarChart2, Printer, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MONTH_FULL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function parseDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00');
}

function Variacao({ a, b }: { a: number; b: number }) {
  if (a === 0 && b === 0) return <span className="text-muted-foreground text-xs">—</span>;
  const diff = b - a;
  const pct = a === 0 ? null : Math.round((diff / a) * 100);
  if (diff === 0) return <span className="flex items-center gap-1 text-gray-500 text-xs justify-end"><Minus className="h-3 w-3" />0</span>;
  if (diff > 0) return (
    <span className="flex items-center gap-1 text-green-600 font-semibold text-xs justify-end">
      <TrendingUp className="h-3 w-3" />+{diff}{pct !== null ? ` (${pct}%)` : ' (novo)'}
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-red-500 font-semibold text-xs justify-end">
      <TrendingDown className="h-3 w-3" />{diff}{pct !== null ? ` (${pct}%)` : ''}
    </span>
  );
}

export default function Estatisticas() {
  const { resultados: batismos } = useResultadosBatismo();
  const { resultados: santasCeias } = useResultadosSantaCeia();
  const { resultados: ensaios } = useResultadosEnsaioRegional();
  const { congregacoes } = useCongregacoes();
  const printRef = useRef<HTMLDivElement>(null);

  // Filter state
  const [filterCity, setFilterCity] = useState<string>('all');
  const [filterCong, setFilterCong] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [comparing, setComparing] = useState(false);
  const [filterYear, setFilterYear] = useState<string>('all');
  const [yearA, setYearA] = useState<string>('all');
  const [yearB, setYearB] = useState<string>('all');

  // Available years from all datasets
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    [...batismos, ...santasCeias].forEach((r) => {
      if (r.data) years.add(parseDate(r.data).getFullYear());
    });
    ensaios.forEach((r) => {
      if (r.data) years.add(parseDate(r.data).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [batismos, santasCeias, ensaios]);

  // Available cities
  const availableCities = useMemo(() => {
    const cities = new Set<string>();
    congregacoes.forEach((c) => { if (c.cidade) cities.add(c.cidade); });
    return Array.from(cities).sort();
  }, [congregacoes]);

  // Filtered congregations by selected city
  const filteredCongregacoes = useMemo(() => {
    if (filterCity === 'all') return congregacoes;
    return congregacoes.filter((c) => c.cidade === filterCity);
  }, [congregacoes, filterCity]);

  // In comparison mode, main filtered arrays use year='all'; otherwise use filterYear
  const effectiveYear = comparing ? 'all' : filterYear;

  // Batismo/SantaCeia filter helper (inlined logic used by useMemo)
  const filteredBatismos = useMemo(() => {
    if (filterType !== 'all' && filterType !== 'batismo') return [];
    return batismos.filter((r) => {
      const d = parseDate(r.data);
      if (effectiveYear !== 'all' && d.getFullYear() !== Number(effectiveYear)) return false;
      if (filterMonth !== 'all' && d.getMonth() !== Number(filterMonth)) return false;
      const cong = congregacoes.find((c) => c.id === r.congregacaoId);
      if (filterCity !== 'all' && cong?.cidade !== filterCity) return false;
      if (filterCong !== 'all' && r.congregacaoId !== filterCong) return false;
      return true;
    });
  }, [batismos, effectiveYear, filterMonth, filterCity, filterCong, filterType, congregacoes]);

  const filteredSantasCeias = useMemo(() => {
    if (filterType !== 'all' && filterType !== 'santaceia') return [];
    return santasCeias.filter((r) => {
      const d = parseDate(r.data);
      if (effectiveYear !== 'all' && d.getFullYear() !== Number(effectiveYear)) return false;
      if (filterMonth !== 'all' && d.getMonth() !== Number(filterMonth)) return false;
      const cong = congregacoes.find((c) => c.id === r.congregacaoId);
      if (filterCity !== 'all' && cong?.cidade !== filterCity) return false;
      if (filterCong !== 'all' && r.congregacaoId !== filterCong) return false;
      return true;
    });
  }, [santasCeias, effectiveYear, filterMonth, filterCity, filterCong, filterType, congregacoes]);

  // Ensaio has no congregacaoId — city/congregation filters only apply when "all"
  const filteredEnsaios = useMemo(() => {
    if (filterType !== 'all' && filterType !== 'ensaio') return [];
    if (filterCity !== 'all' || filterCong !== 'all') return [];
    return ensaios.filter((r) => {
      const d = parseDate(r.data);
      if (effectiveYear !== 'all' && d.getFullYear() !== Number(effectiveYear)) return false;
      if (filterMonth !== 'all' && d.getMonth() !== Number(filterMonth)) return false;
      return true;
    });
  }, [ensaios, effectiveYear, filterMonth, filterCity, filterCong, filterType]);

  // Comparison mode arrays (year A and year B)
  const batismosA = useMemo(() => {
    if (!comparing || (filterType !== 'all' && filterType !== 'batismo')) return [];
    return batismos.filter((r) => {
      const d = parseDate(r.data);
      if (yearA !== 'all' && d.getFullYear() !== Number(yearA)) return false;
      if (filterMonth !== 'all' && d.getMonth() !== Number(filterMonth)) return false;
      const cong = congregacoes.find((c) => c.id === r.congregacaoId);
      if (filterCity !== 'all' && cong?.cidade !== filterCity) return false;
      if (filterCong !== 'all' && r.congregacaoId !== filterCong) return false;
      return true;
    });
  }, [batismos, comparing, yearA, filterMonth, filterCity, filterCong, filterType, congregacoes]);

  const batismosB = useMemo(() => {
    if (!comparing || (filterType !== 'all' && filterType !== 'batismo')) return [];
    return batismos.filter((r) => {
      const d = parseDate(r.data);
      if (yearB !== 'all' && d.getFullYear() !== Number(yearB)) return false;
      if (filterMonth !== 'all' && d.getMonth() !== Number(filterMonth)) return false;
      const cong = congregacoes.find((c) => c.id === r.congregacaoId);
      if (filterCity !== 'all' && cong?.cidade !== filterCity) return false;
      if (filterCong !== 'all' && r.congregacaoId !== filterCong) return false;
      return true;
    });
  }, [batismos, comparing, yearB, filterMonth, filterCity, filterCong, filterType, congregacoes]);

  const santasCeiasA = useMemo(() => {
    if (!comparing || (filterType !== 'all' && filterType !== 'santaceia')) return [];
    return santasCeias.filter((r) => {
      const d = parseDate(r.data);
      if (yearA !== 'all' && d.getFullYear() !== Number(yearA)) return false;
      if (filterMonth !== 'all' && d.getMonth() !== Number(filterMonth)) return false;
      const cong = congregacoes.find((c) => c.id === r.congregacaoId);
      if (filterCity !== 'all' && cong?.cidade !== filterCity) return false;
      if (filterCong !== 'all' && r.congregacaoId !== filterCong) return false;
      return true;
    });
  }, [santasCeias, comparing, yearA, filterMonth, filterCity, filterCong, filterType, congregacoes]);

  const santasCeiasB = useMemo(() => {
    if (!comparing || (filterType !== 'all' && filterType !== 'santaceia')) return [];
    return santasCeias.filter((r) => {
      const d = parseDate(r.data);
      if (yearB !== 'all' && d.getFullYear() !== Number(yearB)) return false;
      if (filterMonth !== 'all' && d.getMonth() !== Number(filterMonth)) return false;
      const cong = congregacoes.find((c) => c.id === r.congregacaoId);
      if (filterCity !== 'all' && cong?.cidade !== filterCity) return false;
      if (filterCong !== 'all' && r.congregacaoId !== filterCong) return false;
      return true;
    });
  }, [santasCeias, comparing, yearB, filterMonth, filterCity, filterCong, filterType, congregacoes]);

  // Summary totals
  const totalBatizados = filteredBatismos.reduce((s, r) => s + Number(r.irmaos) + Number(r.irmas), 0);
  const totalBatizadosIrmaos = filteredBatismos.reduce((s, r) => s + Number(r.irmaos), 0);
  const totalBatizadosIrmas = filteredBatismos.reduce((s, r) => s + Number(r.irmas), 0);
  const totalPartSantaCeia = filteredSantasCeias.reduce((s, r) => s + Number(r.irmaos) + Number(r.irmas), 0);

  const labelA = yearA !== 'all' ? yearA : 'Ano A';
  const labelB = yearB !== 'all' ? yearB : 'Ano B';

  // Comparison totals
  const compTotals = useMemo(() => {
    if (!comparing) return null;
    const batA = batismosA.reduce((s, r) => s + Number(r.irmaos) + Number(r.irmas), 0);
    const batB = batismosB.reduce((s, r) => s + Number(r.irmaos) + Number(r.irmas), 0);
    const scA = santasCeiasA.reduce((s, r) => s + Number(r.irmaos) + Number(r.irmas), 0);
    const scB = santasCeiasB.reduce((s, r) => s + Number(r.irmaos) + Number(r.irmas), 0);
    return { batA, batB, scA, scB, evBatA: batismosA.length, evBatB: batismosB.length, evScA: santasCeiasA.length, evScB: santasCeiasB.length };
  }, [comparing, batismosA, batismosB, santasCeiasA, santasCeiasB]);

  // Print handler
  const handlePrint = () => {
    if (!printRef.current) return;
    const printContents = printRef.current.innerHTML;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html><head><title>Relatório de Estatísticas — CCB</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 13px; color: #111; margin: 24px; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        h2 { font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th { text-align: left; border-bottom: 2px solid #333; padding: 6px 8px; font-size: 12px; }
        td { padding: 5px 8px; border-bottom: 1px solid #e0e0e0; font-size: 12px; }
        .text-right { text-align: right; }
        .up { color: #16a34a; font-weight: bold; }
        .down { color: #dc2626; font-weight: bold; }
        .neutral { color: #6b7280; }
        .card-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
        .card { border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px; }
        .card-label { font-size: 11px; color: #6b7280; }
        .card-value { font-size: 20px; font-weight: bold; }
        @media print { button { display: none; } }
      </style></head><body>
      <h1>Relatório de Estatísticas — CCB Admin</h1>
      <p style="color:#6b7280;font-size:12px;">Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'})}</p>
      ${printContents}
      </body></html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 500);
  };

  // Monthly chart data
  const monthlyData = useMemo(() => {
    if (comparing) {
      return MONTH_NAMES.map((name, idx) => {
        const batA = batismosA.filter((r) => parseDate(r.data).getMonth() === idx).reduce((s, r) => s + Number(r.irmaos) + Number(r.irmas), 0);
        const batB = batismosB.filter((r) => parseDate(r.data).getMonth() === idx).reduce((s, r) => s + Number(r.irmaos) + Number(r.irmas), 0);
        const scA = santasCeiasA.filter((r) => parseDate(r.data).getMonth() === idx).reduce((s, r) => s + Number(r.irmaos) + Number(r.irmas), 0);
        const scB = santasCeiasB.filter((r) => parseDate(r.data).getMonth() === idx).reduce((s, r) => s + Number(r.irmaos) + Number(r.irmas), 0);
        return {
          name,
          [`Batizados ${labelA}`]: batA,
          [`Batizados ${labelB}`]: batB,
          [`S.Ceia ${labelA}`]: scA,
          [`S.Ceia ${labelB}`]: scB,
        };
      });
    }
    return MONTH_NAMES.map((name, idx) => {
      const bat = filteredBatismos.filter((r) => parseDate(r.data).getMonth() === idx).reduce((s, r) => s + Number(r.irmaos) + Number(r.irmas), 0);
      const sc = filteredSantasCeias.filter((r) => parseDate(r.data).getMonth() === idx).reduce((s, r) => s + Number(r.irmaos) + Number(r.irmas), 0);
      const ens = filteredEnsaios.filter((r) => parseDate(r.data).getMonth() === idx).length;
      return { name, Batizados: bat, 'Part. S. Ceia': sc, Ensaios: ens };
    });
  }, [comparing, filteredBatismos, filteredSantasCeias, filteredEnsaios, batismosA, batismosB, santasCeiasA, santasCeiasB, labelA, labelB]);

  // By city breakdown (only shown when city filter is "all")
  const cityData = useMemo(() => {
    if (filterCity !== 'all') return [];
    const map = new Map<string, { batizados: number; santaCeia: number }>();
    filteredBatismos.forEach((r) => {
      const cong = congregacoes.find((c) => c.id === r.congregacaoId);
      const city = cong?.cidade || r.anciaoLocalidade || 'N/A';
      const prev = map.get(city) || { batizados: 0, santaCeia: 0 };
      map.set(city, { ...prev, batizados: prev.batizados + Number(r.irmaos) + Number(r.irmas) });
    });
    filteredSantasCeias.forEach((r) => {
      const cong = congregacoes.find((c) => c.id === r.congregacaoId);
      const city = cong?.cidade || r.anciaoLocalidade || 'N/A';
      const prev = map.get(city) || { batizados: 0, santaCeia: 0 };
      map.set(city, { ...prev, santaCeia: prev.santaCeia + Number(r.irmaos) + Number(r.irmas) });
    });
    return Array.from(map.entries())
      .map(([name, vals]) => ({ name, ...vals }))
      .sort((a, b) => b.batizados + b.santaCeia - (a.batizados + a.santaCeia));
  }, [filteredBatismos, filteredSantasCeias, congregacoes, filterCity]);

  // By congregation table
  const congregationData = useMemo(() => {
    const map = new Map<string, { nome: string; cidade: string; batQty: number; batTotal: number; scQty: number; scTotal: number }>();
    filteredBatismos.forEach((r) => {
      const cong = congregacoes.find((c) => c.id === r.congregacaoId);
      const key = r.congregacaoId || r.anciaoLocalidade || 'N/A';
      const prev = map.get(key) || { nome: cong?.nome || r.anciaoLocalidade || 'N/A', cidade: cong?.cidade || '', batQty: 0, batTotal: 0, scQty: 0, scTotal: 0 };
      map.set(key, { ...prev, batQty: prev.batQty + 1, batTotal: prev.batTotal + Number(r.irmaos) + Number(r.irmas) });
    });
    filteredSantasCeias.forEach((r) => {
      const cong = congregacoes.find((c) => c.id === r.congregacaoId);
      const key = r.congregacaoId || r.anciaoLocalidade || 'N/A';
      const prev = map.get(key) || { nome: cong?.nome || r.anciaoLocalidade || 'N/A', cidade: cong?.cidade || '', batQty: 0, batTotal: 0, scQty: 0, scTotal: 0 };
      map.set(key, { ...prev, scQty: prev.scQty + 1, scTotal: prev.scTotal + Number(r.irmaos) + Number(r.irmas) });
    });
    return Array.from(map.values()).sort((a, b) => b.batTotal - a.batTotal);
  }, [filteredBatismos, filteredSantasCeias, congregacoes]);

  // Ancião ranking
  const anciaoData = useMemo(() => {
    const map = new Map<string, { batismos: number; santasCeias: number }>();
    filteredBatismos.forEach((r) => {
      const nome = r.anciaoNome || 'N/A';
      const prev = map.get(nome) || { batismos: 0, santasCeias: 0 };
      map.set(nome, { ...prev, batismos: prev.batismos + 1 });
    });
    filteredSantasCeias.forEach((r) => {
      const nome = r.anciaoNome || 'N/A';
      const prev = map.get(nome) || { batismos: 0, santasCeias: 0 };
      map.set(nome, { ...prev, santasCeias: prev.santasCeias + 1 });
    });
    return Array.from(map.entries())
      .map(([nome, vals]) => ({ nome, ...vals, total: vals.batismos + vals.santasCeias }))
      .sort((a, b) => b.total - a.total);
  }, [filteredBatismos, filteredSantasCeias]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Estatísticas</h1>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 text-sm font-medium transition-colors"
        >
          <Printer className="h-4 w-4" />
          Imprimir
        </button>
      </div>
      <div ref={printRef}>

      {/* Filter bar */}
      <div className="glass-card rounded-xl p-4 flex flex-wrap gap-3 items-end">
        {/* Cidade */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground font-medium">Cidade</label>
          <Select
            value={filterCity}
            onValueChange={(v) => { setFilterCity(v); setFilterCong('all'); }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Todas as cidades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as cidades</SelectItem>
              {availableCities.map((city) => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Congregação */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground font-medium">Congregação</label>
          <Select value={filterCong} onValueChange={setFilterCong}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {filteredCongregacoes.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mês */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground font-medium">Mês</label>
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {MONTH_FULL.map((m, i) => (
                <SelectItem key={i} value={String(i)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tipo */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground font-medium">Tipo</label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="batismo">Batismo</SelectItem>
              <SelectItem value="santaceia">Santa Ceia</SelectItem>
              <SelectItem value="ensaio">Ensaio Regional</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Year selector + comparison toggle */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground font-medium">
            {comparing ? 'Comparar anos' : 'Ano'}
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {!comparing && (
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {availableYears.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {comparing && (
              <>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Ano A</span>
                  <Select value={yearA} onValueChange={setYearA}>
                    <SelectTrigger className="w-28">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {availableYears.map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Ano B</span>
                  <Select value={yearB} onValueChange={setYearB}>
                    <SelectTrigger className="w-28">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {availableYears.map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <button
              onClick={() => setComparing(!comparing)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                comparing
                  ? 'bg-blue-500 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <BarChart2 className="h-3.5 w-3.5" />
              {comparing ? 'Comparando' : 'Comparar'}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="rounded-lg bg-blue-500/10 p-2.5">
            <Droplets className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Eventos Batismo</p>
            <p className="text-2xl font-bold text-foreground">{filteredBatismos.length}</p>
            {comparing && compTotals && (
              <div className="mt-1">
                <Variacao a={compTotals.evBatA} b={compTotals.evBatB} />
              </div>
            )}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-lg bg-amber-500/10 p-2.5">
              <Users className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Batizados</p>
              <p className="text-2xl font-bold text-foreground">{totalBatizados}</p>
            </div>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground mt-1 pl-1">
            <span>♂ Irmãos: <span className="font-semibold text-foreground">{totalBatizadosIrmaos}</span></span>
            <span>♀ Irmãs: <span className="font-semibold text-foreground">{totalBatizadosIrmas}</span></span>
          </div>
          {comparing && compTotals && (
            <div className="mt-1 pl-1">
              <Variacao a={compTotals.batA} b={compTotals.batB} />
            </div>
          )}
        </div>

        <div className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="rounded-lg bg-purple-500/10 p-2.5">
            <Award className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Santas Ceias</p>
            <p className="text-2xl font-bold text-foreground">{filteredSantasCeias.length}</p>
            <p className="text-xs text-muted-foreground">{totalPartSantaCeia} participantes</p>
            {comparing && compTotals && (
              <div className="mt-1">
                <Variacao a={compTotals.scA} b={compTotals.scB} />
              </div>
            )}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="rounded-lg bg-green-500/10 p-2.5">
            <Music className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ensaios Regionais</p>
            <p className="text-2xl font-bold text-foreground">{filteredEnsaios.length}</p>
          </div>
        </div>
      </div>

      {/* Batizados detail table */}
      {filteredBatismos.length > 0 && (
        <div className="glass-card rounded-xl p-4">
          <h2 className="text-base font-semibold text-foreground mb-4">Detalhamento de Batizados</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Data</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Congregação</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Cidade</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">♂ Irmãos</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">♀ Irmãs</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {[...filteredBatismos]
                  .sort((a, b) => b.data.localeCompare(a.data))
                  .map((r, i) => {
                    const cong = congregacoes.find((c) => c.id === r.congregacaoId);
                    return (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-2 px-3 text-muted-foreground">{new Date(r.data + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                        <td className="py-2 px-3 font-medium text-foreground">{cong?.nome || '—'}</td>
                        <td className="py-2 px-3 text-muted-foreground">{cong?.cidade || r.anciaoLocalidade || '—'}</td>
                        <td className="py-2 px-3 text-right text-blue-500 font-semibold">{Number(r.irmaos)}</td>
                        <td className="py-2 px-3 text-right text-pink-500 font-semibold">{Number(r.irmas)}</td>
                        <td className="py-2 px-3 text-right font-bold text-foreground">{Number(r.irmaos) + Number(r.irmas)}</td>
                      </tr>
                    );
                  })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/20">
                  <td colSpan={3} className="py-2 px-3 font-semibold text-foreground">Total</td>
                  <td className="py-2 px-3 text-right font-bold text-blue-500">{totalBatizadosIrmaos}</td>
                  <td className="py-2 px-3 text-right font-bold text-pink-500">{totalBatizadosIrmas}</td>
                  <td className="py-2 px-3 text-right font-bold text-foreground">{totalBatizados}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Monthly comparison chart */}
      <div className="glass-card rounded-xl p-4">
        <h2 className="text-base font-semibold text-foreground mb-4">
          {comparing ? `Comparativo Mensal — ${labelA} vs ${labelB}` : 'Comparativo Mensal'}
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip />
            <Legend />
            {comparing ? (
              <>
                <Bar dataKey={`Batizados ${labelA}`} fill="#3b82f6" radius={[3, 3, 0, 0]} />
                <Bar dataKey={`Batizados ${labelB}`} fill="#93c5fd" radius={[3, 3, 0, 0]} />
                <Bar dataKey={`S.Ceia ${labelA}`} fill="#a855f7" radius={[3, 3, 0, 0]} />
                <Bar dataKey={`S.Ceia ${labelB}`} fill="#d8b4fe" radius={[3, 3, 0, 0]} />
              </>
            ) : (
              <>
                <Bar dataKey="Batizados" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Part. S. Ceia" fill="#a855f7" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Ensaios" fill="#22c55e" radius={[3, 3, 0, 0]} />
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* By city chart — only when city filter is "all" */}
      {filterCity === 'all' && cityData.length > 0 && (
        <div className="glass-card rounded-xl p-4">
          <h2 className="text-base font-semibold text-foreground mb-4">Por Cidade</h2>
          <ResponsiveContainer width="100%" height={Math.max(200, cityData.length * 48)}>
            <BarChart data={cityData} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={75} />
              <Tooltip />
              <Legend />
              <Bar dataKey="batizados" name="Batizados" fill="#3b82f6" radius={[0, 3, 3, 0]} />
              <Bar dataKey="santaCeia" name="Part. S. Ceia" fill="#a855f7" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* By congregation table */}
      {congregationData.length > 0 && (
        <div className="glass-card rounded-xl p-4">
          <h2 className="text-base font-semibold text-foreground mb-4">Por Congregação</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Congregação</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Cidade</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Batismos (qt)</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Batizados</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">S. Ceias (qt)</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Part. S. Ceia</th>
                </tr>
              </thead>
              <tbody>
                {congregationData.map((row, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-2 px-3 font-medium text-foreground">{row.nome}</td>
                    <td className="py-2 px-3 text-muted-foreground">{row.cidade}</td>
                    <td className="py-2 px-3 text-right">{row.batQty}</td>
                    <td className="py-2 px-3 text-right font-semibold text-blue-500">{row.batTotal}</td>
                    <td className="py-2 px-3 text-right">{row.scQty}</td>
                    <td className="py-2 px-3 text-right font-semibold text-purple-500">{row.scTotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ancião ranking */}
      {anciaoData.length > 0 && (
        <div className="glass-card rounded-xl p-4">
          <h2 className="text-base font-semibold text-foreground mb-4">Ranking de Anciãos</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">#</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Ancião</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Batismos</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">S. Ceias</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {anciaoData.map((row, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-2 px-3 text-muted-foreground">{i + 1}</td>
                    <td className="py-2 px-3 font-medium text-foreground">{row.nome}</td>
                    <td className="py-2 px-3 text-right text-blue-500">{row.batismos}</td>
                    <td className="py-2 px-3 text-right text-purple-500">{row.santasCeias}</td>
                    <td className="py-2 px-3 text-right font-bold text-foreground">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Comparison summary table */}
      {comparing && compTotals && (
        <div className="glass-card rounded-xl p-4">
          <h2 className="text-base font-semibold text-foreground mb-4">
            Resumo Comparativo — {labelA} vs {labelB}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Indicador</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">{labelA}</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">{labelB}</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Variação</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-2 px-3 font-medium text-foreground">Eventos de Batismo</td>
                  <td className="py-2 px-3 text-right">{compTotals.evBatA}</td>
                  <td className="py-2 px-3 text-right">{compTotals.evBatB}</td>
                  <td className="py-2 px-3 text-right"><Variacao a={compTotals.evBatA} b={compTotals.evBatB} /></td>
                </tr>
                <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-2 px-3 font-medium text-foreground">Total Batizados</td>
                  <td className="py-2 px-3 text-right text-blue-500 font-semibold">{compTotals.batA}</td>
                  <td className="py-2 px-3 text-right text-blue-500 font-semibold">{compTotals.batB}</td>
                  <td className="py-2 px-3 text-right"><Variacao a={compTotals.batA} b={compTotals.batB} /></td>
                </tr>
                <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-2 px-3 font-medium text-foreground">Santas Ceias (eventos)</td>
                  <td className="py-2 px-3 text-right">{compTotals.evScA}</td>
                  <td className="py-2 px-3 text-right">{compTotals.evScB}</td>
                  <td className="py-2 px-3 text-right"><Variacao a={compTotals.evScA} b={compTotals.evScB} /></td>
                </tr>
                <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-2 px-3 font-medium text-foreground">Participantes S. Ceia</td>
                  <td className="py-2 px-3 text-right text-purple-500 font-semibold">{compTotals.scA}</td>
                  <td className="py-2 px-3 text-right text-purple-500 font-semibold">{compTotals.scB}</td>
                  <td className="py-2 px-3 text-right"><Variacao a={compTotals.scA} b={compTotals.scB} /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>{/* end printRef */}
    </div>
  );
}
