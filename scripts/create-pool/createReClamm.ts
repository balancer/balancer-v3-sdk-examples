import { parseEther, publicActions, parseEventLogs, parseUnits, zeroAddress, Address } from 'viem';
import { getPoolTokenBalances, waEthLidowETH, waEthLidowstETH } from '../utils';
import { initializePool } from '../initialize-pool/initialize';
import hre from 'hardhat';

import { CreatePool, CreatePoolReClammInput, PoolType, TokenType, reClammPoolFactoryAbi_V3, calculateReClammInitAmounts } from '@balancer/sdk';

// npx hardhat run scripts/create-pool/createReClamm.ts
export async function createPoolReClamm() {
  const chainId = hre.network.config.chainId!;
  const [walletClient] = await hre.viem.getWalletClients();
  const client = walletClient.extend(publicActions);

  const beets: Address = "0x0f409e839a6a790aecb737e4436293be11717f95"
  const usdc: Address = "0x80d6d3946ed8a1da4e226aa21ccddc32bd127d1a"

  const createPoolInput: CreatePoolReClammInput = {
    poolType: PoolType.ReClamm,
    chainId,
    protocolVersion: 3,
    name: 'Beets USDC',
    symbol: 'BEETS-USDC',
    tokens: [
      {
        address: beets,
        rateProvider: zeroAddress,
        tokenType: TokenType.STANDARD,
        paysYieldFees: false,
      },
      {
        address: usdc,
        rateProvider: zeroAddress,
        tokenType: TokenType.STANDARD,
        paysYieldFees: false,
      },
    ],
    swapFeePercentage: parseEther('0.01'),
    pauseManager: client.account.address,
    swapFeeManager: client.account.address,
    // ReClamm specific parameters
    initialMinPrice: parseUnits('0.5', 18),
    initialMaxPrice: parseUnits('8', 18),
    initialTargetPrice: parseUnits('3', 18),
    priceShiftDailyRate: parseUnits('1', 18),
    centerednessMargin: parseUnits('0.2', 18),
  };

  const createPool = new CreatePool();
  const createPoolCall = createPool.buildCall(createPoolInput);

  const createHash = await walletClient.sendTransaction({
    account: walletClient.account,
    data: createPoolCall.callData,
    to: createPoolCall.to,
  });

  const txReceipt = await client.waitForTransactionReceipt({ hash: createHash });

  const poolCreatedEvent = parseEventLogs({
    logs: txReceipt.logs,
    abi: reClammPoolFactoryAbi_V3,
  });

  // @ts-expect-error pool address exists in args
  const poolAddress = poolCreatedEvent[0]?.args?.pool as `0x${string}`;

  console.log(`${createPoolInput.poolType} pool created at: ${poolAddress}`);

  const givenAmountIn = {
    address: beets,
    rawAmount: parseEther('1'),
    decimals: 18,
  };

  const tokens = [
    {
      address: beets,
      index: 0,
      decimals: 18,
    },
    {
      address: usdc,
      index: 1,
      decimals: 6,
    },
  ]

  const amountsIn = await calculateReClammInitAmounts(
    {
      ...createPoolInput,
      tokens,
      givenAmountIn,
    }
  )

  await initializePool(poolAddress, {
    chainId,
    amountsIn,
    minBptAmountOut: 0n,
  });
}

createPoolReClamm()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// getPoolTokenBalances()
//   .then(() => createPoolReClamm())
//   .then(() => process.exit())
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   });
