import { useContractRead } from "wagmi";
import { opConfig } from "../op-helpers";

export const useCanCreateOpProposal = (address?: string) => {
  const {
    data: isMember,
    isSuccess,
    isError,
    isLoading,
    error,
    status,
  } = useContractRead({
    ...opConfig,
    functionName: "isMember",
    args: ["0x47d80912400ef8f8224531EBEB1ce8f2ACf4b75a"],
    enabled: !!address,
  });

  return { isMember, isSuccess, isError, isLoading, error, status };
};
