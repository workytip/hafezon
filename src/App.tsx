import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PomodoroProvider } from "./contexts/PomodoroContext";
import { AppNav } from "./components/AppNav";
import Index from "./pages/Index";
import Ramadan from "./pages/Ramadan";
import DailyMuslim from "./pages/DailyMuslim";
import Pomodoro from "./pages/Pomodoro";
import Analytics from "./pages/Analytics";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PomodoroProvider>
      <BrowserRouter basename="/hafezon">
        <div className="pb-20 md:pb-0">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/ramadan" element={<Ramadan />} />
            <Route path="/daily-muslim" element={<DailyMuslim />} />
            <Route path="/pomodoro" element={<Pomodoro />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/contact" element={<Contact />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
        <AppNav />
      </BrowserRouter>
      </PomodoroProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
