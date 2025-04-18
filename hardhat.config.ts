import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-viem";
import * as dotenv from "dotenv";

dotenv.config();

const mainnetRpcUrl = process.env.MAINNET_RPC_URL;
const sepoliaRpcUrl = process.env.SEPOLIA_RPC_URL;
const privateKey = process.env.PRIVATE_KEY;
if (!mainnetRpcUrl) throw new Error("MAINNET_RPC_URL is not set");
if (!sepoliaRpcUrl) throw new Error("SEPOLIA_RPC_URL is not set");
if (!privateKey) throw new Error("PRIVATE_KEY is not set");

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      forking: {
        url: mainnetRpcUrl,
        blockNumber: 22297100,
      },
      chainId: 1,
    },
    sepolia: {
      url: sepoliaRpcUrl,
      accounts: [privateKey],
      chainId: 11155111,
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
