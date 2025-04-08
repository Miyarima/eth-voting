import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  // gasReporter: {
  //   enabled: true,
  //   currency: "USD",
  // },
};

export default config;