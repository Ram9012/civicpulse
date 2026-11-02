import { useQuery } from "@tanstack/react-query";
import type { Department } from "@civicpulse/contract";
import { api } from "./api";

/** Department names rarely change; cache them and look names up by id. */
export function useDepartments() {
  const q = useQuery({
    queryKey: ["departments"],
    queryFn: () => api<Department[]>("/departments"),
    staleTime: 5 * 60_000,
    refetchInterval: false,
  });
  const list = q.data ?? [];
  const name = (id: string | null | undefined) => list.find((d) => d.id === id)?.name ?? "Unassigned";
  return { list, name };
}
