import {
  hash, KeyType, Property, PropertyType,
} from '@0auth/message';
import { ec as ECDSA, eddsa as EdDSA } from 'elliptic';

export function getMerkleRoot(properties: string[]): string {
  if (properties.length === 1) return properties[0];

  const parentNodes = [];
  for (let i = 0; i < properties.length - 1; i += 2) {
    parentNodes.push(hash(properties[i] + properties[i + 1]));
  }

  if (properties.length % 2 === 1) {
    parentNodes.push(properties[properties.length - 1]);
  }

  return getMerkleRoot(parentNodes);
}

export function publicKeyFromKeyString(keyString: string, type: KeyType): string {
  switch (type) {
    case KeyType.ECDSA: {
      const ecdsa = new ECDSA('secp256k1');
      const secret = ecdsa.keyFromPrivate(keyString, 'hex');
      return secret.getPublic('hex');
    }
    case KeyType.EDDSA: {
      const eddsa = new EdDSA('ed25519');
      const secret = eddsa.keyFromSecret(keyString);
      return secret.getPublic('hex');
    }
    default:
      throw new Error('Unreachable Code');
  }
}

export function signByKeyType(
  hashValue: string,
  secret: string,
  type: KeyType,
): string {
  switch (type) {
    case KeyType.ECDSA: {
      const ecdsa = new ECDSA('secp256k1');
      const key = ecdsa.keyFromPrivate(secret, 'hex');
      return key.sign(hashValue).toDER('hex');
    }
    case KeyType.EDDSA: {
      const eddsa = new EdDSA('ed25519');
      const key = eddsa.keyFromSecret(secret);
      return key.sign(hashValue).toHex();
    }
    default:
      throw new Error('Unreachable Code');
  }
}

export function verifyByKeyType(
  hashValue: string,
  sign: string,
  publicKey: string,
  type: KeyType,
): boolean {
  switch (type) {
    case KeyType.ECDSA: {
      const ecdsa = new ECDSA('secp256k1');
      const key = ecdsa.keyFromPublic(publicKey, 'hex');
      return key.verify(hashValue, sign);
    }
    case KeyType.EDDSA: {
      const eddsa = new EdDSA('ed25519');
      const key = eddsa.keyFromPublic(publicKey);
      return key.verify(hashValue, sign);
    }
    default:
      throw new Error('Unreachable Code');
  }
}

export function propertyObject(properties: Property[]): { [key: string]: string } {
  return properties.reduce(
    (dict: { [key: string]: string }, property) => {
      if (property.type !== PropertyType.Hash) {
        return {
          ...dict,
          [property.key]: property.value,
        };
      }
      return dict;
    },
    {},
  );
}

export function objectToProperty(object: { [key: string]: string }): Property[] {
  return Object.keys(object).map(key => ({
    type: PropertyType.Raw,
    key,
    value: object[key]
  }))
}
