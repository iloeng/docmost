import React from "react";
import { MfaChallenge } from "@/ee/mfa";
import { useMfaPageProtection } from "@/ee/mfa";
import { Center, Loader } from "@mantine/core";

export function MfaChallengePage() {
  const { isValidating, isValid } = useMfaPageProtection();

  if (isValidating) {
    return (
      <Center h="100vh">
        <Loader size="md" />
      </Center>
    );
  }

  if (!isValid) {
    return null;
  }

  return <MfaChallenge />;
}
