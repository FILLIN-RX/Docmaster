import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/dropzone/styles.css";
import "@mantine/notifications/styles.css";
import { DatesProvider } from "@mantine/dates";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { I18nProvider } from "./context/I18nContext";
import { ToastProvider } from "./context/ToastContext";
import ToastContainer from "./components/ui/ToastContainer";
import { docmasterTheme } from "./theme/mantine";
import "./i18n";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <MantineProvider theme={docmasterTheme}>
      <DatesProvider settings={{ locale: "fr" }}>
        <BrowserRouter>
          <ToastProvider>
            <AuthProvider>
              <I18nProvider>
                <App />
                <ToastContainer />
              </I18nProvider>
            </AuthProvider>
          </ToastProvider>
        </BrowserRouter>
      </DatesProvider>
    </MantineProvider>
  </React.StrictMode>
);

