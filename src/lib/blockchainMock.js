// Mock Hyperledger Fabric blockchain utilities
// Implements: SHA3-256 hash (via crypto-compatible), merkle root, block structure

/**
 * Simple deterministic hash (for demo — mirrors SHA3-256 concept)
 * In production: use SHA3-256(customerID + salt)
 */
export function hashCustomerID(customerID, salt = 'GCS_SALT_2026') {
  // Simple deterministic hash for demo (not cryptographic)
  let hash = 0;
  const str = customerID + salt;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return '0x' + Math.abs(hash).toString(16).padStart(8, '0') + 
    Math.abs(hash * 31).toString(16).padStart(8, '0') +
    Math.abs(hash * 97).toString(16).padStart(8, '0') +
    Math.abs(hash * 53).toString(16).padStart(8, '0');
}

export function hashTxID(txRef, timestamp, customerHash) {
  const str = txRef + timestamp + customerHash;
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) + str.charCodeAt(i);
  }
  return '0x' + Math.abs(h).toString(16).padStart(64, '0').substring(0, 64);
}

export function computeMerkleRoot(txHashes) {
  if (!txHashes || txHashes.length === 0) return '0x' + '0'.repeat(64);
  let combined = txHashes.join('');
  let h = 0;
  for (let i = 0; i < combined.length; i++) {
    h = ((h << 5) - h) + combined.charCodeAt(i);
    h = h & h;
  }
  return '0x' + Math.abs(h).toString(16).padStart(64, '0').substring(0, 64);
}

const VALIDATORS = ['BankA (VCB)', 'BankB (TCB)', 'NAPAS', 'CIC', 'SBV Node'];

/**
 * Build a mock block from a transaction record
 */
export function buildBlock(tx, customerID, previousHash = null) {
  const timestamp = tx.created_date || new Date().toISOString();
  const customerHash = hashCustomerID(customerID || 'user@example.com');
  const txID = hashTxID(tx.id || 'tx', timestamp, customerHash);
  const merkleRoot = computeMerkleRoot([txID]);
  const blockNum = parseInt(tx.id?.substring(0, 8) || '0', 16) % 100000 + 800000;

  return {
    blockID: '0x' + Math.abs(blockNum).toString(16).padStart(8, '0') + 'a2f1',
    blockNumber: blockNum,
    previousHash: previousHash || '0x' + '3c8b'.repeat(8).substring(0, 16) + '...',
    timestamp,
    merkleRoot,
    status: 'CONFIRMED',
    confirmations: Math.floor(Math.random() * 50) + 6,
    transactions: [
      {
        type: tx.gcs_points_earned >= 0 ? 'EARN' : 'REDEEM',
        txID,
        customerHash,
        gcsPoints: Math.abs(tx.gcs_points_earned || 0),
        txAmount: tx.amount || 0,
        txType: tx.type?.toUpperCase() || 'UNKNOWN',
        channel: 'MOBILE_APP',
        multiplier: tx.multiplier_applied || 1.0,
        partnerCode: tx.merchant_name?.substring(0, 8).toUpperCase() || 'SYSTEM',
      }
    ],
    validators: VALIDATORS.slice(0, 3),
  };
}

export const LOYALTY_PARTNERS = [
  {
    id: 'momo',
    name: 'MoMo Rewards',
    logo: '🩷',
    color: 'bg-pink-500/10 text-pink-600',
    rate: 100,
    unit: 'MoMo Coins',
    description: '1 GCS → 100 MoMo Coins',
    minGCS: 10,
  },
  {
    id: 'lynkid',
    name: 'VPBank LynkiD',
    logo: '💚',
    color: 'bg-green-500/10 text-green-600',
    rate: 4.5,
    unit: 'LynkiD points',
    description: '1 GCS → 4–5 LynkiD points',
    minGCS: 50,
  },
  {
    id: 'oneu',
    name: 'Techcombank OneU',
    logo: '🔴',
    color: 'bg-red-500/10 text-red-600',
    rate: 3.5,
    unit: 'U-Points',
    description: '1 GCS → 3–4 U-Points',
    minGCS: 50,
  },
  {
    id: 'lotusmiles',
    name: 'Lotusmiles (VNA)',
    logo: '✈️',
    color: 'bg-blue-500/10 text-blue-600',
    rate: 1 / 300,
    unit: 'Miles',
    description: '300 GCS → 1 Lotusmiles mile',
    minGCS: 300,
  },
];