import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Index from "./pages/Index";
import Congregacoes from "./pages/Congregacoes";
import Ministerio from "./pages/Ministerio";
import Agenda from "./pages/Agenda";
import SantaCeia from "./pages/SantaCeia";
import Ensaios from "./pages/Ensaios";
import Reforcos from "./pages/Reforcos";
import Relatorios from "./pages/Relatorios";
import Resultados from "./pages/Resultados";
import Listas from "./pages/Listas";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={import.meta.env.PROD ? "/ccb-admin-suite" : ""}>
        <Layout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/congregacoes" element={<Congregacoes />} />
            <Route path="/ministerio" element={<Ministerio />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/santa-ceia" element={<SantaCeia />} />
            <Route path="/ensaios" element={<Ensaios />} />
            <Route path="/reforcos" element={<Reforcos />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/resultados" element={<Resultados />} />
            <Route path="/listas" element={<Listas />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
