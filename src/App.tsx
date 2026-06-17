import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import Library from "./pages/Library";
import Editor from "./pages/Editor";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Router hook={useHashLocation}>
      <Switch>
        <Route path="/" component={Library} />
        <Route path="/doc/:id" component={Editor} />
        <Route component={NotFound} />
      </Switch>
    </Router>
  );
}
