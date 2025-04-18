import hre from 'hardhat';
import { erc20Abi } from 'viem';

// Approve a spender on a token contract
export async function approveOnToken(token: `0x${string}`, spender: `0x${string}`, rawAmount: bigint) {
  const [walletClient] = await hre.viem.getWalletClients();

  await walletClient.writeContract({
    address: token,
    abi: erc20Abi,
    functionName: 'approve',
    args: [spender, rawAmount],
    account: walletClient.account.address,
  });
}
