import { randomBytes } from 'crypto';
import { TOKEN_LENGTH } from '../config/constants';

export function generateToken(length: number = TOKEN_LENGTH): string {
  return randomBytes(length / 2).toString('hex');
}
