import React, { useState } from "react";
import {
  Container,
  Title,
  Text,
  PinInput,
  Button,
  Stack,
  Anchor,
  Paper,
  Center,
  ThemeIcon,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { IconDeviceMobile, IconLock } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { notifications } from "@mantine/notifications";
import classes from "./mfa-challenge.module.css";
import { verifyMfa } from "@/ee/mfa";
import APP_ROUTE from "@/lib/app-route";
import { useTranslation } from "react-i18next";
import { useRedirectIfNoMfaToken } from "../hooks/use-redirect-if-no-mfa-token";
import * as z from "zod";

const formSchema = z.object({
  code: z
    .string()
    .min(6, { message: "Please enter a 6-digit code" })
    .max(6, { message: "Code must be exactly 6 digits" }),
  //.regex(/^\d{6}$/, { message: "Code must contain only numbers" }),
});

type MfaChallengeFormValues = z.infer<typeof formSchema>;

export function MfaChallenge() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect to login if there's no MFA transfer token
  // useRedirectIfNoMfaToken();

  const form = useForm<MfaChallengeFormValues>({
    validate: zodResolver(formSchema),
    initialValues: {
      code: "",
    },
  });

  const handleSubmit = async (values: MfaChallengeFormValues) => {
    setIsLoading(true);
    try {
      await verifyMfa(values.code);
      navigate(APP_ROUTE.HOME);
    } catch (error: any) {
      setIsLoading(false);
      notifications.show({
        message:
          error.response?.data?.message || t("Invalid verification code"),
        color: "red",
      });
      form.setFieldValue("code", "");
    }
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

              <Anchor component="button" type="button" size="sm" c="dimmed">
                Need help authenticating?
              </Anchor>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Container>
  );
}
