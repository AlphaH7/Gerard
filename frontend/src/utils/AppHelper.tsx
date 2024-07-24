// @ts-nocheck
/* eslint-disable no-bitwise */

export const generateUUID: () => string = () => {
  // Helper function to generate random values
  const getRandomValues = (buffer: Uint8Array): Uint8Array => {
    if (window.crypto && window.crypto.getRandomValues) {
      return window.crypto.getRandomValues(buffer);
    }
    throw new Error('Crypto API not available');
  };

  // Initialize a buffer with 16 random bytes
  const buffer = new Uint8Array(16);
  getRandomValues(buffer);

  // Get the current timestamp
  const timestamp = Date.now();

  // Use the last four bytes of the buffer to store the timestamp
  buffer[12] = (timestamp & 0xff000000) >> 24;
  buffer[13] = (timestamp & 0x00ff0000) >> 16;
  buffer[14] = (timestamp & 0x0000ff00) >> 8;
  buffer[15] = timestamp & 0x000000ff;

  // Set the version number (4) and the variant (RFC4122 compliant)
  buffer[6] = (buffer[6] & 0x0f) | 0x40; // Version 4
  buffer[8] = (buffer[8] & 0x3f) | 0x80; // Variant RFC4122

  // Convert buffer to UUID string format
  const byteToHex = Array.from(buffer).map((b) =>
    `00${b.toString(16)}`.slice(-2)
  );

  return [
    byteToHex.slice(0, 4).join(''),
    byteToHex.slice(4, 6).join(''),
    byteToHex.slice(6, 8).join(''),
    byteToHex.slice(8, 10).join(''),
    byteToHex.slice(10, 16).join(''), // Including timestamp in the UUID
  ].join('-');
};
