import { useState } from 'react';
import { Plus, Trash2, UserCheck } from 'lucide-react';
import { useMembros } from '@/hooks/useData';
import { Membro, TipoMinisterio } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Badge } from '@/components/ui/badge';

const ministerios: TipoMinisterio[] = [
  'Ancião',
  'Diácono',
  'Cooperador do Ofício',
  'Cooperador de Jovens e Menores',
];

const badgeColor: Record<TipoMinisterio, string> = {
  'Ancião': 'bg-primary/10 text-primary border-primary/20',
  'Diácono': 'bg-accent/20 text-accent-foreground border-accent/30',
  'Cooperador do Ofício': 'bg-success/10 text-success border-success/20',
  'Cooperador de Jovens e Menores': 'bg-warning/20 text-warning-foreground border-warning/30',
};

export default function Ministerio() {
  const { membros, adicionar, remover } = useMembros();
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [ministerio, setMinisterio] = useState<TipoMinisterio>('Ancião');
  const [filtro, setFiltro] = useState<string>('Todos');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome) return;
    adicionar({ nome, ministerio });
    setNome('');
    setOpen(false);
  };

  const filtered = filtro === 'Todos' ? membros : membros.filter((m) => m.ministerio === filtro);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Ministério</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cadastro do ministério da Administração
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Novo Membro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Novo Membro do Ministério</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" />
              </div>
              <div>
                <Label>Ministério</Label>
                <Select value={ministerio} onValueChange={(v) => setMinisterio(v as TipoMinisterio)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ministerios.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end">
                <Button type="submit">Salvar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['Todos', ...ministerios].map((m) => (
          <button
            key={m}
            onClick={() => setFiltro(m)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              filtro === m
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <UserCheck className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-4 text-muted-foreground">Nenhum membro cadastrado.</p>
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ministério</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {[...filtered]
                  .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                  .map((m) => (
                  <tr key={m.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{m.nome}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={badgeColor[m.ministerio]}>
                        {m.ministerio}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => remover(m.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
