import { Building2, Users, Calendar, ShieldCheck, Droplets, Grape } from 'lucide-react';
import { useCongregacoes, useMembros, useEventos, useReforcos, useResultadosBatismo, useResultadosSantaCeia } from '@/hooks/useData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Dashboard() {
  const { congregacoes } = useCongregacoes();
  const { membros } = useMembros();
  const { eventos } = useEventos();
  const { reforcos } = useReforcos();
  const { resultados: batismos } = useResultadosBatismo();
  const { resultados: santaceias } = useResultadosSantaCeia();

  const anoAtual = new Date().getFullYear().toString();

  const getCidade = (congregacaoId: string) => {
    const c = congregacoes.find((c) => c.id === congregacaoId);
    return c?.cidade || 'Sem cidade';
  };

  const batismosAno = batismos.filter((b) => b.data?.startsWith(anoAtual));
  const santaceiasAno = santaceias.filter((s) => s.data?.startsWith(anoAtual));

  const totalBatizadosIrmaos = batismosAno.reduce((acc, b) => acc + Number(b.irmaos || 0), 0);
  const totalBatizadosIrmas = batismosAno.reduce((acc, b) => acc + Number(b.irmas || 0), 0);
  const totalBatizados = totalBatizadosIrmaos + totalBatizadosIrmas;

  const totalSantaCeiaIrmaos = santaceiasAno.reduce((acc, s) => acc + Number(s.irmaos || 0), 0);
  const totalSantaCeiaIrmas = santaceiasAno.reduce((acc, s) => acc + Number(s.irmas || 0), 0);
  const totalSantaCeia = totalSantaCeiaIrmaos + totalSantaCeiaIrmas;

  const agruparPorCidade = (lista: { congregacaoId: string; irmaos?: number | string; irmas?: number | string }[]) => {
    const mapa: Record<string, { irmaos: number; irmas: number }> = {};
    for (const item of lista) {
      const cidade = getCidade(item.congregacaoId);
      if (!mapa[cidade]) mapa[cidade] = { irmaos: 0, irmas: 0 };
      mapa[cidade].irmaos += Number(item.irmaos || 0);
      mapa[cidade].irmas += Number(item.irmas || 0);
    }
    return Object.entries(mapa)
      .map(([cidade, totais]) => ({ cidade, ...totais, total: totais.irmaos + totais.irmas }))
      .sort((a, b) => b.total - a.total);
  };

  const batismosPorCidade = agruparPorCidade(batismosAno);
  const santaceiaPorCidade = agruparPorCidade(santaceiasAno);

  const stats = [
    { label: 'Congregações', value: congregacoes.length, icon: Building2, color: 'text-primary' },
    { label: 'Ministério', value: membros.length, icon: Users, color: 'text-accent' },
    { label: 'Eventos', value: eventos.length, icon: Calendar, color: 'text-success' },
    { label: 'Reforços', value: reforcos.length, icon: ShieldCheck, color: 'text-warning' },
  ];

  const TabelaCidade = ({ dados, corTotal }: { dados: { cidade: string; irmaos: number; irmas: number; total: number }[]; corTotal: string }) =>
    dados.length > 0 ? (
      <div className="mt-4 border-t border-border pt-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Por cidade</p>
        <div className="space-y-1">
          {dados.map(({ cidade, irmaos, irmas, total }) => (
            <div key={cidade} className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-muted/50">
              <span className="font-medium text-foreground">{cidade}</span>
              <div className="flex items-center gap-3 text-muted-foreground">
                <span className="text-blue-600">{irmaos}♂</span>
                <span className="text-pink-500">{irmas}♀</span>
                <span className={`font-bold ${corTotal} min-w-[2rem] text-right`}>{total}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    ) : null;

  return (
    <div className="space-y-8">
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-bold font-display text-foreground">Bem-vindo ao Painel</h1>
        <p className="text-muted-foreground mt-2 text-lg">Administração Ituiutaba — Congregação Cristã no Brasil</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <div key={stat.label} className="glass-card stat-card-hover rounded-xl p-6 group" style={{ animationDelay: `${idx * 0.1}s` }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{stat.label}</p>
                <p className="mt-3 text-3xl font-bold text-foreground">{stat.value}</p>
              </div>
              <div className={`rounded-xl bg-gradient-to-br from-${stat.color.split('-')[1]}-100 to-${stat.color.split('-')[1]}-50 p-4 ${stat.color} shadow-md group-hover:shadow-lg transition-all`}>
                <stat.icon className="h-7 w-7" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-xl font-semibold font-display text-foreground mb-4">Resultados {anoAtual}</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <Card className="glass-card border-border">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="rounded-xl bg-blue-100 p-3">
                <Droplets className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Batismos</CardTitle>
                <p className="text-sm text-muted-foreground">{batismosAno.length} evento{batismosAno.length !== 1 ? 's' : ''} realizados</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <div className="text-center p-3 rounded-lg bg-blue-50">
                  <p className="text-xs text-muted-foreground mb-1">Irmãos</p>
                  <p className="text-2xl font-bold text-blue-700">{totalBatizadosIrmaos}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-pink-50">
                  <p className="text-xs text-muted-foreground mb-1">Irmãs</p>
                  <p className="text-2xl font-bold text-pink-600">{totalBatizadosIrmas}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-primary/10">
                  <p className="text-xs text-muted-foreground mb-1">Total</p>
                  <p className="text-2xl font-bold text-primary">{totalBatizados}</p>
                </div>
              </div>
              <TabelaCidade dados={batismosPorCidade} corTotal="text-blue-700" />
            </CardContent>
          </Card>

          <Card className="glass-card border-border">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="rounded-xl bg-purple-100 p-3">
                <Grape className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Santa Ceia</CardTitle>
                <p className="text-sm text-muted-foreground">{santaceiasAno.length} evento{santaceiasAno.length !== 1 ? 's' : ''} realizados</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <div className="text-center p-3 rounded-lg bg-blue-50">
                  <p className="text-xs text-muted-foreground mb-1">Irmãos</p>
                  <p className="text-2xl font-bold text-blue-700">{totalSantaCeiaIrmaos}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-pink-50">
                  <p className="text-xs text-muted-foreground mb-1">Irmãs</p>
                  <p className="text-2xl font-bold text-pink-600">{totalSantaCeiaIrmas}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-purple-50">
                  <p className="text-xs text-muted-foreground mb-1">Total</p>
                  <p className="text-2xl font-bold text-purple-700">{totalSantaCeia}</p>
                </div>
              </div>
              <TabelaCidade dados={santaceiaPorCidade} corTotal="text-purple-700" />
            </CardContent>
          </Card>
        </div>
      </div>

      {congregacoes.length === 0 && (
        <div className="glass-card rounded-xl p-10 text-center border-2 border-dashed border-border/50">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-accent/10 p-4">
              <Building2 className="h-10 w-10 text-accent" />
            </div>
          </div>
          <h3 className="mt-4 text-xl font-semibold font-display text-foreground">Comece cadastrando suas congregações</h3>
          <p className="mt-2 text-muted-foreground">Acesse o menu <strong>Congregações</strong> na lateral para adicionar a primeira.</p>
        </div>
      )}
    </div>
  );
}