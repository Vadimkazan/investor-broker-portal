import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export const useFavorites = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await api.getFavorites(user.id);
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });
};

export const useAddToFavorites = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (objectId: number) => {
      if (!user) throw new Error('User not authenticated');
      return await api.addToFavorites(user.id, objectId);
    },
    onMutate: async (objectId) => {
      await queryClient.cancelQueries({ queryKey: ['favorites', user?.id] });

      const previousFavorites = queryClient.getQueryData<number[]>(['favorites', user?.id]);

      queryClient.setQueryData<number[]>(['favorites', user?.id], (old = []) => [...old, objectId]);

      return { previousFavorites };
    },
    onError: (err, objectId, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(['favorites', user?.id], context.previousFavorites);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
    },
  });
};

export const useRemoveFromFavorites = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (objectId: number) => {
      if (!user) throw new Error('User not authenticated');
      return await api.removeFromFavorites(user.id, objectId);
    },
    onMutate: async (objectId) => {
      await queryClient.cancelQueries({ queryKey: ['favorites', user?.id] });

      const previousFavorites = queryClient.getQueryData<number[]>(['favorites', user?.id]);

      queryClient.setQueryData<number[]>(['favorites', user?.id], (old = []) =>
        old.filter((id) => id !== objectId)
      );

      return { previousFavorites };
    },
    onError: (err, objectId, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(['favorites', user?.id], context.previousFavorites);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
    },
  });
};
