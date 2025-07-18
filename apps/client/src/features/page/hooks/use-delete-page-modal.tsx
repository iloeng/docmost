import { modals } from "@mantine/modals";
import { Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

type UseDeleteModalProps = {
  onConfirm: () => void;
};

export function useDeletePageModal() {
  const { t } = useTranslation();
  const openDeleteModal = ({ onConfirm }: UseDeleteModalProps) => {
    modals.openConfirmModal({
      title: t("Move to trash"),
      children: (
        <Text size="sm">
          {t(
            "Are you sure you want to move this page to trash? This will also move all its sub-pages. You can restore it later from the trash.",
          )}
        </Text>
      ),
      centered: true,
      labels: { confirm: t("Move to trash"), cancel: t("Cancel") },
      confirmProps: { color: "red" },
      onConfirm,
    });
  };

  return { openDeleteModal } as const;
}
