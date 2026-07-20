import { createRoot } from "react-dom/client";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";

import App from "./App";
import { getAdminApiKey } from "./lib/adminAuth";

import "./index.css";

setBaseUrl(import.meta.env.VITE_API_BASE_URL || null);
setAuthTokenGetter(getAdminApiKey);

createRoot(document.getElementById("root")!).render(<App />);
