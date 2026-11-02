import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import App from "./App";
import { AuthProvider } from "./lib/auth";
import { I18nProvider } from "./lib/i18n";
import "./index.css";

// refetchInterval keeps every portal fresh without websockets: a staff action shows up for the citizen within ~10s.
const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchInterval: 10_000, staleTime: 5_000 } },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <I18nProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </I18nProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
