import api from '@/lib/api-client';
import { IPagination } from '@/lib/types';

export interface ITrashPage {
  id: string;
  slugId: string;
  title: string;
  icon?: string;
  spaceId: string;
  deletedAt: string;
  deletedById: string;
  deletedBy: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  space: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface ITrashParams {
  spaceId: string;
  page?: number;
  limit?: number;
}

export async function getTrashPages(params: ITrashParams): Promise<IPagination<ITrashPage>> {
  const req = await api.post<IPagination<ITrashPage>>('/pages/trash', params);
  return req.data;
}