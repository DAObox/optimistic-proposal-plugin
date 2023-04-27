import { BigNumber, BigNumberish } from "ethers";

export const ethFormatter = (value: BigNumberish) => {
  return `Ξ ${BigNumber.from(value)
    .div(BigNumber.from(10).pow(18))
    .toString()}`;
};
