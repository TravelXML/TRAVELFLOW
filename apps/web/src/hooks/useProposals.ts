import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { CreateProposalInput, ProposalDetail, ProposalSummary } from "../types";

export function useProposals(status?: string) {
  return useQuery({
    queryKey: ["proposals", status ?? "all"],
    queryFn: async () => {
      const { data } = await api.get<{ proposals: ProposalSummary[]; total: number }>("/proposals", {
        params: status ? { status } : {},
      });
      return data;
    },
  });
}

export function useProposal(id: string | undefined) {
  return useQuery({
    queryKey: ["proposal", id],
    queryFn: async () => {
      const { data } = await api.get<ProposalDetail>(`/proposals/${id}`);
      return data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateProposalInput) => {
      const { data } = await api.post<ProposalDetail>("/proposals", input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
    },
  });
}

export function useSendProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/proposals/${id}/send`);
      return data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      queryClient.invalidateQueries({ queryKey: ["proposal", id] });
    },
  });
}

export function useDeleteProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/proposals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
    },
  });
}
