import React, { useState } from "react";
import {
  Group,
  Text,
  ActionIcon,
  Menu,
  Badge,
  Container,
  Title,
  Paper,
  Table,
  Loader,
  Center
} from "@mantine/core";
import { IconTrash, IconRestore, IconDotsVertical } from "@tabler/icons-react";
import {
  useTrashPages,
  useRestorePage,
  usePermanentlyDeletePage,
} from "../queries/trash-query";
import { formatDistanceToNow } from "date-fns";
import { modals } from "@mantine/modals";
import { useParams } from "react-router-dom";
import { useGetSpaceBySlugQuery } from "@/features/space/queries/space-query";
import NoTableResults from "@/components/common/no-table-results.tsx";
import Paginate from "@/components/common/paginate.tsx";

export function TrashPage() {
  const [page, setPage] = useState(1);
  const { spaceSlug } = useParams();
  const { data: space } = useGetSpaceBySlugQuery(spaceSlug);

  const { data, isLoading } = useTrashPages(
    {
      spaceId: space?.id,
      page,
      limit: 20,
    },
    { enabled: !!space?.id },
  );
  const restoreMutation = useRestorePage();
  const deleteMutation = usePermanentlyDeletePage();

  const handleRestore = (pageId: string) => {
    restoreMutation.mutate(pageId);
  };

  const handlePermanentDelete = (pageId: string, pageTitle: string) => {
    modals.openConfirmModal({
      title: "Permanently delete page",
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to permanently delete "{pageTitle || "Untitled"}
          "? This action cannot be undone.
        </Text>
      ),
      labels: { confirm: "Delete permanently", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => deleteMutation.mutate(pageId),
    });
  };

  if (!space) {
    return null;
  }

  if (isLoading) {
    return (
      <Container size="xl" py="xl">
        <Title order={2} mb="xl">
          {space.name} - Trash
        </Title>
        <Paper withBorder p="xl">
          <Center>
            <Loader />
          </Center>
        </Paper>
      </Container>
    );
  }

  if (!data?.items || data?.items?.length === 0) {
    return (
      <Container size="xl" py="xl">
        <Title order={2} mb="xl">
          {space.name} - Trash
        </Title>
        <Paper withBorder p="xl">
          <NoTableResults colSpan={3} />
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Title order={2} mb="xl">
        {space.name} - Trash
      </Title>
      <Paper withBorder>
        <Table.ScrollContainer minWidth={500}>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Page</Table.Th>
                <Table.Th>Deleted by</Table.Th>
                <Table.Th>Deleted</Table.Th>
                <Table.Th maw={80}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.items.map((page) => (
                <Table.Tr key={page.id}>
                  <Table.Td>
                    <Group gap="xs">
                      {page.icon && <span>{page.icon}</span>}
                      <Text>{page.title || "Untitled"}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{page.deletedBy?.name}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {formatDistanceToNow(new Date(page.deletedAt), {
                        addSuffix: true,
                      })}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Menu position="bottom-end">
                      <Menu.Target>
                        <ActionIcon variant="subtle" color="gray">
                          <IconDotsVertical size={16} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item
                          leftSection={<IconRestore size={16} />}
                          onClick={() => handleRestore(page.id)}
                          disabled={restoreMutation.isPending}
                        >
                          Restore
                        </Menu.Item>
                        <Menu.Item
                          color="red"
                          leftSection={<IconTrash size={16} />}
                          onClick={() =>
                            handlePermanentDelete(page.id, page.title)
                          }
                          disabled={deleteMutation.isPending}
                        >
                          Delete permanently
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>
      
      {data?.items.length > 0 && (
        <Paginate
          currentPage={page}
          hasPrevPage={data?.meta.hasPrevPage}
          hasNextPage={data?.meta.hasNextPage}
          onPageChange={setPage}
        />
      )}
    </Container>
  );
}
