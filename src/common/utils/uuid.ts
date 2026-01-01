import { NodeCryptoHelper } from '@/common/utils/helpers/node-helper';

export function generateUuid() {
  return NodeCryptoHelper.randomUUID();
}
