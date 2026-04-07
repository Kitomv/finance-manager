import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { AccessControlProvider, useAccessControl } from "./contexts/AccessControlContext";
import NotificationContainer from "./components/NotificationContainer";
import Home from "./pages/Home";
import Transactions from "./pages/Transactions";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Installments from "./pages/Installments";
import Savings from "./pages/Savings";
import Budget from "./pages/Budget";
import Login from "./pages/Login";
import UserManagement from "./pages/UserManagement";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { currentUser } = useAccessControl();
  
  if (!currentUser) {
    return <Login />;
  }
  
  return <Component />;
}

function Router() {
  const { currentUser } = useAccessControl();
  
  if (!currentUser) {
    return (
      <Switch>
        <Route path="/" component={Login} />
        <Route component={Login} />
      </Switch>
    );
  }
  
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/transactions" component={Transactions} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/installments" component={Installments} />
      <Route path="/savings" component={Savings} />
      <Route path="/budget" component={Budget} />
      <Route path="/settings" component={Settings} />
      <Route path="/user-management" component={UserManagement} />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <AccessControlProvider>
        <ThemeProvider
          defaultTheme="light"
          switchable
        >
          <NotificationProvider>
            <TooltipProvider>
              <Toaster />
              <NotificationContainer />
              <Router />
            </TooltipProvider>
          </NotificationProvider>
        </ThemeProvider>
      </AccessControlProvider>
    </ErrorBoundary>
  );
}

export default App;
