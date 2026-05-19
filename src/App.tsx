import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MapDashboard } from "@/components/map/MapDashboard";
import "@/store/useThemeStore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MapDashboard />
    </QueryClientProvider>
  );
}
