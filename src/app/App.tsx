import { BrowserRouter } from "react-router-dom"

import { AuthProvider } from "./AuthContext"
import { ErrorBoundary } from "../components/layout/ErrorBoundary"
import { AppRoutes } from "../routes"

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  )
}
