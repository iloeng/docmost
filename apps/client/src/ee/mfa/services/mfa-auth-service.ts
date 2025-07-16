import api from "@/lib/api-client";

export interface VerifyMfaDto {
  code: string;
  trustDevice?: boolean;
}

export interface MfaVerifyResponse {
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export async function verifyMfa(
  data: VerifyMfaDto,
): Promise<MfaVerifyResponse> {
  // Get the MFA transfer token from session storage
  const mfaTransferToken = sessionStorage.getItem("mfaTransferToken");

  if (!mfaTransferToken) {
    throw new Error("MFA transfer token not found");
  }

  // Make the request with the MFA transfer token in the Authorization header
  const response = await api.post<MfaVerifyResponse>("/auth/mfa-verify", data, {
    headers: {
      Authorization: `Bearer ${mfaTransferToken}`,
    },
  });

  // Clear the MFA transfer token after successful verification
  sessionStorage.removeItem("mfaTransferToken");

  return response.data;
}
