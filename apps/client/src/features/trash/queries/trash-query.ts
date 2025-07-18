import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTrashPages, ITrashParams } from '../services/trash-service';
import { deletePage, restorePage } from '@/features/page/services/page-service';
import { notifications } from '@mantine/notifications';

export const trashKeys = {
  all: ['trash'] as const,
  pages: (params: ITrashParams) => [...trashKeys.all, 'pages', params] as const,
};

export function useTrashPages(params: ITrashParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: trashKeys.pages(params),
    queryFn: () => getTrashPages(params),
    enabled: options?.enabled ?? true,
  });
}

export function useRestorePage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (pageId: string) => restorePage(pageId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: trashKeys.all });
      queryClient.invalidateQueries({ queryKey: ['sidebar-pages'] });
      /*
      // Emit socket event for real-time sync
      setTimeout(() => {
        emit({
          operation: "restoreTreeNode",
          spaceId: data.page.spaceId,
          payload: {
            pageId: data.page.id,
            restoredPageIds: data.restoredPageIds,
            detachedFromParent: data.detachedFromParent,
          },
        });
      }, 50);*/
      
      if (data.detachedFromParent) {
        notifications.show({
          title: 'Page restored',
          message: 'Page restored as root page (parent was deleted)',
          color: 'blue',
        });
      } else {
        notifications.show({
          title: 'Success',
          message: 'Page restored successfully',
          color: 'green',
        });
      }
    },
    onError: () => {
      notifications.show({
        title: 'Error',
        message: 'Failed to restore page',
        color: 'red',
      });
    },
  });
}

export function usePermanentlyDeletePage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (pageId: string) => deletePage(pageId, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trashKeys.all });
      notifications.show({
        title: 'Success',
        message: 'Page permanently deleted',
        color: 'green',
      });
    },
    onError: () => {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete page',
        color: 'red',
      });
    },
  });
}