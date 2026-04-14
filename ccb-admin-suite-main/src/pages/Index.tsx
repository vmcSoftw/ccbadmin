import { Building2, Users, Calendar, ShieldCheck } from 'lucide-react';
import { useCongregacoes, useMembros, useEventos, useReforcos } from '@/hooks/useData';

export default function Dashboard() {
  const { congregacoes } = useCongregacoes();
  const { membros } = useMembros();
  const { eventos } = useEventos();
  const { reforcos } = useReforcos();

  const stats = [
    { label: 'Congregações', value: congregacoes.length, icon: Building2, color: 'text-primary' },
    { label: 'Ministério', value: membros.length, icon: Users, color: 'text-accent' },
    { label: 'Eventos', value: eventos.length, icon: Calendar, color: 'text-success' },
    { label: 'Reforços', value: reforcos.length, icon: ShieldCheck, color: 'text-warning' },
  ];

  return (
    <div className="space-y-8">
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-bold font-display text-foreground">
          Bem-vindo ao Painel
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Administração Ituiutaba — Congregação Cristã no Brasil
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <div
            key={stat.label}
            className="glass-card stat-card-hover rounded-xl p-6 group"
            style={{
              animationDelay: `${idx * 0.1}s`,
            }}
          >
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

      {congregacoes.length === 0 && (
        <div className="glass-card rounded-xl p-10 text-center border-2 border-dashed border-border/50">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-accent/10 p-4">
              <Building2 className="h-10 w-10 text-accent" />
            </div>
          </div>
          <h3 className="mt-4 text-xl font-semibold font-display text-foreground">
            Comece cadastrando suas congregações
          </h3>
          <p className="mt-2 text-muted-foreground">
            Acesse o menu <strong>Congregações</strong> na lateral para adicionar a primeira.
          </p>
        </div>
      )}
    </div>
  );
}
