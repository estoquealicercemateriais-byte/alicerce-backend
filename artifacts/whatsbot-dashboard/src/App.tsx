import { useLocation } from "wouter";
import { useEffect } from "react";
import { Shell } from "./components/layout/Shell";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Route, Switch, Router as WouterRouter } from "wouter";

import DashboardPage from "@/pages/dashboard";
import ConversationsPage from "@/pages/conversations";
import OrdersPage from "@/pages/orders";
import BudgetsPage from "@/pages/budgets";
import ProductsPage from "@/pages/products";
import SettingsPage from "@/pages/settings";

const queryClient = new QueryClient();

function RedirectToDashboard() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/dashboard");
  }, [setLocation]);
  return null;
}

function Router() {
  return (
    <Shell>
      <Switch>
        <Route path="/" component={RedirectToDashboard} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/conversations" component={ConversationsPage} />
        <Route path="/orders" component={OrdersPage} />
        <Route path="/budgets" component={BudgetsPage} />
        <Route path="/products" component={ProductsPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
