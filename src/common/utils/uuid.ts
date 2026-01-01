import { NodeCryptoHelper } from './helpers/node-helper';

export function generateUuid() {
  return NodeCryptoHelper.randomUUID();
}
