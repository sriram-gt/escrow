import { Contract, Interface, type ContractRunner, type Provider } from 'ethers'

export const SEPOLIA_CHAIN_ID = 11_155_111n
export const SEPOLIA_CHAIN_ID_HEX = '0xaa36a7' as const
export const SEPOLIA_NETWORK = {
  chainId: SEPOLIA_CHAIN_ID,
  chainIdHex: SEPOLIA_CHAIN_ID_HEX,
  name: 'sepolia',
  nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
  blockExplorerUrl: 'https://sepolia.etherscan.io',
} as const

export const ESCROW_MARKETPLACE_ADDRESS =
  '0xe9E9C73036Dc81710c270B4A6a303622a87f8d06' as const

// Verified from the Sepolia contract-creation transaction on Etherscan:
// 0xe6af39a53c5e95f3dff170a5af9dd560c8ce3998348902aaa45d9e4d4e04cc05.
// Keeping history queries anchored here avoids asking public RPCs for the
// entire Sepolia chain from block zero.
export const ESCROW_MARKETPLACE_DEPLOYMENT_BLOCK = 11_862_969n
export const MAX_LOG_RANGE = 10_000n

export const DEFAULT_ADMIN_ROLE = `0x${'00'.repeat(32)}` as const
export const ARBITRATOR_ROLE =
  '0x16ceee8289685dd2a02b9c8ae81d2df373176ce53519e6284e2a2950d6546ffa' as const

/**
 * Minimal ABI for the deployed contract. Do not add methods here unless they
 * are present on the deployed contract.
 */
export const ESCROW_MARKETPLACE_ABI = [
  'function DEFAULT_ADMIN_ROLE() view returns (bytes32)',
  'function ARBITRATOR_ROLE() view returns (bytes32)',
  'function nextJobId() view returns (uint256)',
  'function paused() view returns (bool)',
  'function jobs(uint256) view returns (uint256 id, address client, address freelancer, uint256 budget, string description, string workSubmission, uint8 status, bool disputeRaised)',
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'function getRoleAdmin(bytes32 role) view returns (bytes32)',
  'function supportsInterface(bytes4 interfaceId) view returns (bool)',
  'function createJob(string description, uint256 budget)',
  'function fundJob(uint256 jobId) payable',
  'function acceptJob(uint256 jobId)',
  'function submitWork(uint256 jobId, string work)',
  'function approveWork(uint256 jobId)',
  'function raiseDispute(uint256 jobId)',
  'function resolveDispute(uint256 jobId, bool favorFreelancer)',
  'function pause()',
  'function unpause()',
  'function grantRole(bytes32 role, address account)',
  'function revokeRole(bytes32 role, address account)',
  'function renounceRole(bytes32 role, address callerConfirmation)',
  'error UnauthorizedCaller()',
  'error EmptyDescription()',
  'error IncorrectFundingAmount(uint256 expected, uint256 received)',
  'error InsufficientBalance(uint256 requested, uint256 available)',
  'error AccessControlUnauthorizedAccount(address account, bytes32 neededRole)',
  'error EnforcedPause()',
  'error ExpectedPause()',
  'error ReentrancyGuardReentrantCall()',
  'error FailedCall()',
  'event JobCreated(uint256 indexed jobId, address indexed client, uint256 amount, string description)',
  'event JobAccepted(uint256 indexed jobId, address indexed freelancer)',
  'event JobFunded(uint256 indexed jobId, address indexed funder, uint256 amount)',
  'event WorkSubmitted(uint256 indexed jobId, address indexed freelancer, string work)',
  'event DisputeRaised(uint256 indexed jobId, address indexed raisedBy)',
  'event PaymentReleased(uint256 indexed jobId, address indexed freelancer, uint256 amount)',
  'event JobRefunded(uint256 indexed jobId, address indexed client, uint256 amount)',
  'event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)',
  'event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)',
  'event Paused(address indexed account)',
  'event Unpaused(address indexed account)',
] as const

export const ESCROW_MARKETPLACE_INTERFACE = new Interface(ESCROW_MARKETPLACE_ABI)

export function getEscrowMarketplaceContract(runner: ContractRunner | null): Contract {
  return new Contract(ESCROW_MARKETPLACE_ADDRESS, ESCROW_MARKETPLACE_ABI, runner)
}

export function getEscrowMarketplaceReadContract(provider: Provider): Contract {
  return getEscrowMarketplaceContract(provider)
}
