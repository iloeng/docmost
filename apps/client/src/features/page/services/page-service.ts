import api from "@/lib/api-client";
import {
  ICopyPageToSpace,
  IExportPageParams,
  IMovePage,
  IMovePageToSpace,
  IPage,
  IPageInput,
  SidebarPagesParams,
} from '@/features/page/types/page.types';
import { QueryParams } from "@/lib/types";
import { IAttachment, IPagination } from "@/lib/types.ts";
import { saveAs } from "file-saver";
import { InfiniteData } from "@tanstack/react-query";
import { IFileTask } from '@/features/file-task/types/file-task.types.ts';

export async function createPage(data: Partial<IPage>): Promise<IPage> {
  const req = await api.post<IPage>("/pages/create", data);
  return req.data;
}

export async function getPageById(
  pageInput: Partial<IPageInput>,
): Promise<IPage> {
  const req = await api.post<IPage>("/pages/info", pageInput);
  return req.data;
}

export async function updatePage(data: Partial<IPageInput>): Promise<IPage> {
  const req = await api.post<IPage>("/pages/update", data);
  return req.data;
}

export async function deletePage(pageId: string, permanentlyDelete = false): Promise<void> {
  await api.post("/pages/delete", { pageId, permanentlyDelete });
}

export async function getDeletedPages(
  spaceId: string,
  params?: QueryParams,
): Promise<IPagination<IPage>> {
  const req = await api.post("/pages/trash", { spaceId, ...params });
  return req.data;
}

export async function restorePage(pageId: string): Promise<IPage> {
  const response = await api.post<IPage>("/pages/restore", { pageId });
  return response.data;
}

export async function movePage(data: IMovePage): Promise<void> {
  await api.post<void>("/pages/move", data);
}

export async function movePageToSpace(data: IMovePageToSpace): Promise<void> {
  await api.post<void>("/pages/move-to-space", data);
}

export async function duplicatePage(data: ICopyPageToSpace): Promise<IPage> {
  const req = await api.post<IPage>("/pages/duplicate", data);
  return req.data;
}

export async function getSidebarPages(
  params: SidebarPagesParams,
): Promise<IPagination<IPage>> {
  const req = await api.post("/pages/sidebar-pages", params);
  return req.data;
}

export async function getAllSidebarPages(
  params: SidebarPagesParams,
): Promise<InfiniteData<IPagination<IPage>, unknown>> {
  let page = 1;
  let hasNextPage = false;
  const pages: IPagination<IPage>[] = [];
  const pageParams: number[] = [];

  do {
    const req = await api.post("/pages/sidebar-pages", { ...params, page: page });

    const data: IPagination<IPage> = req.data;
    pages.push(data);
    pageParams.push(page);

    hasNextPage = data.meta.hasNextPage;

    page += 1;
  } while (hasNextPage);

  return {
    pageParams,
    pages,
  };
}

export async function getPageBreadcrumbs(
  pageId: string,
): Promise<Partial<IPage[]>> {
  const req = await api.post("/pages/breadcrumbs", { pageId });
  return req.data;
}

export async function getRecentChanges(
  spaceId?: string,
): Promise<IPagination<IPage>> {
  const req = await api.post("/pages/recent", { spaceId });
  return req.data;
}

export async function exportPage(data: IExportPageParams): Promise<void> {
  const req = await api.post("/pages/export", data, {
    responseType: "blob",
  });

  const fileName = req?.headers["content-disposition"]
    .split("filename=")[1]
    .replace(/"/g, "");

  saveAs(req.data, decodeURIComponent(fileName));
}

export async function importPage(file: File, spaceId: string) {
  const formData = new FormData();
  formData.append("spaceId", spaceId);
  formData.append("file", file);

  const req = await api.post<IPage>("/pages/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return req.data;
}

export async function importZip(
  file: File,
  spaceId: string,
  source?: string,
): Promise<IFileTask> {
  const formData = new FormData();
  formData.append("spaceId", spaceId);
  formData.append("source", source);
  formData.append("file", file);

  const req = await api.post<any>("/pages/import-zip", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return req.data;
}

export async function uploadFile(
  file: File,
  pageId: string,
  attachmentId?: string,
): Promise<IAttachment> {
  const formData = new FormData();
  if (attachmentId) {
    formData.append("attachmentId", attachmentId);
  }
  formData.append("pageId", pageId);
  formData.append("file", file);

  const req = await api.post<IAttachment>("/files/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return req as unknown as IAttachment;
}
