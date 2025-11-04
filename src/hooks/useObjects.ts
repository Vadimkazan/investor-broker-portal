import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, InvestmentObjectDB, ObjectFilters } from '@/services/api';
import { InvestmentObject } from '@/types/InvestmentObject';
import { convertDBObjectToFrontend } from '@/utils/objectConverter';

export const useObjects = (filters?: ObjectFilters) => {
  return useQuery({
    queryKey: ['objects', filters],
    queryFn: async () => {
      const dbObjects = await api.getObjects(filters);
      return dbObjects.map(convertDBObjectToFrontend);
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useObject = (id: number) => {
  return useQuery({
    queryKey: ['object', id],
    queryFn: async () => {
      const dbObject = await api.getObjectById(id);
      return convertDBObjectToFrontend(dbObject);
    },
    enabled: !!id,
  });
};

export const useUpdateObject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: number;
      updates: Partial<InvestmentObjectDB>;
    }) => {
      return await api.updateObject(id, updates);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['objects'] });
      queryClient.invalidateQueries({ queryKey: ['object', variables.id] });
    },
  });
};

export const useCreateObject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<InvestmentObjectDB, 'id' | 'created_at'>) => {
      return await api.createObject(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objects'] });
    },
  });
};

export const useDeleteObject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      return await api.deleteObject(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objects'] });
    },
  });
};
