import { AppProvider } from "../context/AppContext";

export const RootComponent = ({ children }: { children: React.ReactNode }) => (
  <AppProvider>{children}</AppProvider>
);
