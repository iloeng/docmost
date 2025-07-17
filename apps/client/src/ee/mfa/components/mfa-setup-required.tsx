import React from "react";
import {
  Container,
  Paper,
  Title,
  Text,
  Alert,
  Stack,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import MfaSetupModal from "./mfa-setup-modal";

export default function MfaSetupRequired() {
  const { t } = useTranslation();

  const handleSetupComplete = () => {
    // After successful MFA setup, navigate to home
    window.location.href = "/";
  };

  return (
    <Container size="sm" py="xl">
      <Paper shadow="sm" p="xl" radius="md" withBorder>
        <Stack spacing="lg">
          <Title order={2} ta="center">
            {t("Two-factor authentication required")}
          </Title>

          <Alert icon={<IconAlertCircle size="1rem" />} color="yellow">
            <Text size="sm">
              {t(
                "Your workspace requires two-factor authentication. Please set it up to continue.",
              )}
            </Text>
          </Alert>

          <Text c="dimmed" size="sm" ta="center">
            {t(
              "This adds an extra layer of security to your account by requiring a verification code from your authenticator app.",
            )}
          </Text>

          <MfaSetupModal
            opened={true}
            onClose={() => {
              // Can't close - MFA is required
            }}
            onComplete={handleSetupComplete}
            isRequired={true}
          />
        </Stack>
      </Paper>
    </Container>
  );
}