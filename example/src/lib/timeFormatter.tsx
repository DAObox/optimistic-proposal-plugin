import { BigNumber, BigNumberish } from "ethers";

// convert bignumber in seconds to days hours min
export const timeFormatter = (value: BigNumberish) => {
  const seconds = BigNumber.from(value);
  const days = seconds.div(60 * 60 * 24);
  const hours = seconds.div(60 * 60);
  const minutes = seconds.div(60);
  return `${days} : ${hours} : ${minutes}`;
};
