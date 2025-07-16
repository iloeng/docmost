import React, { useState } from "react";
import {
  Container,
  Title,
  Text,
  PinInput,
  Button,
  Checkbox,
  Box,
  Stack,
  Group,
  Anchor,
  Paper,
  Center,
  ThemeIcon,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconDeviceMobile, IconLock } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { notifications } from "@mantine/notifications";
import classes from "./mfa-challenge.module.css";
import { verifyMfa } from "../services/mfa-auth-service";
import APP_ROUTE from "@/lib/app-route";
import { useTranslation } from "react-i18next";
import { useRedirectIfNoMfaToken } from "../hooks/use-redirect-if-no-mfa-token";

interface MfaChallengeFormValues {
  code: string;
  trustDevice: boolean;
}

export function MfaChallenge() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect to login if there's no MFA transfer token
  // useRedirectIfNoMfaToken();

  const form = useForm<MfaChallengeFormValues>({
    initialValues: {
      code: "",
      trustDevice: false,
    },
    validate: {
      code: (value) => {
        if (!value || value.length !== 6) {
          return "Please enter a 6-digit code";
        }
        return null;
      },
    },
  });

  const handleSubmit = async (values: MfaChallengeFormValues) => {
    setIsLoading(true);
    try {
      await verifyMfa({
        code: values.code,
      });
      navigate(APP_ROUTE.HOME);
    } catch (error: any) {
      setIsLoading(false);
      notifications.show({
        message: error.response?.data?.message || "Invalid verification code",
        color: "red",
      });
      form.setFieldValue("code", "");
    }
  };

  const handleUseBackupMethod = () => {
    // TODO: Implement backup method navigation
    notifications.show({
      message: "Backup authentication methods coming soon",
      color: "blue",
    });
  };

  const handleNeedHelp = () => {
    // TODO: Implement help navigation
    notifications.show({
      message: "Help documentation coming soon",
      color: "blue",
    });
  };

  return (
    <Container size={420} className={classes.container}>
      <Paper radius="lg" p={40} className={classes.paper}>
        <Stack align="center" gap="xl">
          <Center>
            <ThemeIcon size={80} radius="xl" variant="light" color="blue">
              <IconDeviceMobile size={40} stroke={1.5} />
            </ThemeIcon>
          </Center>

          <Stack align="center" gap="xs">
            <Title order={2} ta="center" fw={600}>
              Two-Factor Authentication
            </Title>
            <Text size="sm" c="dimmed" ta="center">
              Enter the 6-digit code found in your authenticator app
            </Text>
          </Stack>

          <form
            onSubmit={form.onSubmit(handleSubmit)}
            style={{ width: "100%" }}
          >
            <Stack gap="lg">
              <PinInput
                length={6}
                type="number"
                size="lg"
                autoFocus
                oneTimeCode
                {...form.getInputProps("code")}
                styles={{
                  input: {
                    fontSize: "1.2rem",
                    textAlign: "center",
                  },
                }}
              />

              <Button
                type="submit"
                fullWidth
                size="md"
                loading={isLoading}
                leftSection={<IconLock size={18} />}
              >
                Confirm
              </Button>

              <Checkbox
                label="Trust this device for 30 days"
                {...form.getInputProps("trustDevice", { type: "checkbox" })}
              />

              <Stack gap="xs" align="center">
                <Anchor
                  component="button"
                  type="button"
                  size="sm"
                  onClick={handleUseBackupMethod}
                >
                  Use another authentication method
                </Anchor>
                <Anchor
                  component="button"
                  type="button"
                  size="sm"
                  c="dimmed"
                  onClick={handleNeedHelp}
                >
                  Need help authenticating?
                </Anchor>
              </Stack>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Container>
  );
}
