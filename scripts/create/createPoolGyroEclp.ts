import { parseEther, publicActions, zeroAddress, parseEventLogs, parseUnits } from 'viem';
import { getPoolTokenBalances, waEthLidowETH, waEthLidowstETH } from '../utils';
import { initializePool } from './initializePool';
import hre from 'hardhat';

import { CreatePool, CreatePoolGyroECLPInput, PoolType, TokenType, gyroECLPPoolFactoryAbi_V3, calcDerivedParams } from '@balancer/sdk';

// TODO: Make sure script works after gyroECLP factory deployed to mainnet? (only on arb, base, and sepolia atm)

// npx hardhat run scripts/create/createPoolGyroEclp.ts
export async function createPoolGyroEclp    () {
  // User defined inputs
  const chainId = hre.network.config.chainId!;
  const [walletClient] = await hre.viem.getWalletClients();
  const client = walletClient.extend(publicActions);
  const poolType = PoolType.GyroE;
  const protocolVersion = 3 as const;

  const eclpParams = { 
    alpha: parseUnits("0.998502246630054917", 18),
    beta: parseUnits("1.000200040008001600", 18),
    c: parseUnits("0.707106781186547524", 18),
    s: parseUnits("0.707106781186547524", 18),
    lambda: parseUnits("4000", 18),
  };

  const createPoolInput: CreatePoolGyroECLPInput = {
    poolType,
    chainId,
    protocolVersion,
    name: 'Balancer Aave Lido wETH-wstETH',
    symbol: 'Aave Lido wETH-wstETH',
    tokens: [
      {
        address: waEthLidowETH,
        rateProvider: '0xf4b5d1c22f35a460b91edd7f33cefe619e2faaf4',
        tokenType: TokenType.TOKEN_WITH_RATE,
        paysYieldFees: true,
      },
      {
        address: waEthLidowstETH,
        rateProvider: '0xcdaa68ce322728fe4185a60f103c194f1e2c47bc',
        tokenType: TokenType.TOKEN_WITH_RATE,
        paysYieldFees: true,
      },
    ],
    swapFeePercentage: parseEther('0.01'),
    poolHooksContract: zeroAddress,
    pauseManager: client.account.address,
    swapFeeManager: client.account.address,
    disableUnbalancedLiquidity: false,
    enableDonation: false,
    eclpParams,
    derivedEclpParams: calcDerivedParams(eclpParams)
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
    abi: gyroECLPPoolFactoryAbi_V3,
  });

  // @ts-expect-error pool address exists in args
  const poolAddress = poolCreatedEvent[0]?.args?.pool as `0x${string}`;

  console.log(`${poolType} pool created at: ${poolAddress}`);

  await initializePool(poolAddress, {
    chainId,
    minBptAmountOut: 0n,
    amountsIn: [
      {
        address: waEthLidowETH,
        rawAmount: parseEther('1'),
        decimals: 18,
      },
      {
        address: waEthLidowstETH,
        rawAmount: parseEther('1'),
        decimals: 18,
      },
    ],
  });
}

getPoolTokenBalances()
  .then(() => createPoolGyroEclp())
  .then(() => process.exit())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
