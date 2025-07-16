import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMfaStatus,
  setupMfa,
  enableMfa,
  disableMfa,
  regenerateBackupCodes, MfaSetupRequest, MfaEnableRequest, MfaDisableRequest,
} from '@/ee/mfa';


export function useMfaStatusQuery() {
  return useQuery({
    queryKey: ["mfa-status"],
    queryFn: getMfaStatus,
  });
}

export function useSetupMfaMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: MfaSetupRequest) => setupMfa(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mfa-status"] });
    },
  });
}

export function useEnableMfaMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: MfaEnableRequest) => enableMfa(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mfa-status"] });
    },
  });
}

export function useDisableMfaMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: MfaDisableRequest) => disableMfa(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mfa-status"] });
    },
  });
}

export function useRegenerateBackupCodesMutation() {
  return useMutation({
    mutationFn: regenerateBackupCodes,
  });
}