export function generatePixPayload(key: string, name: string = 'Recebedor', city: string = 'Cidade', txid: string = '***'): string {
  // Helpers to format EMV fields
  const formatField = (id: string, value: string) => {
    const length = value.length.toString().padStart(2, '0');
    return `${id}${length}${value}`;
  };

  const payloadFormatIndicator = formatField('00', '01');
  const pointOfInitiationMethod = formatField('01', '11'); // 11 means static, 12 dynamic
  const gui = formatField('00', 'br.gov.bcb.pix');
  const pixKey = formatField('01', key);
  const merchantAccountInformation = formatField('26', gui + pixKey);
  const merchantCategoryCode = formatField('52', '0000');
  const transactionCurrency = formatField('53', '986');
  const countryCode = formatField('58', 'BR');
  
  // Clean up name and city to remove accents and limit length
  const cleanString = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 25);
  const merchantName = formatField('59', cleanString(name) || 'N');
  const merchantCity = formatField('60', cleanString(city) || 'C');
  const additionalDataField = formatField('62', formatField('05', txid));

  let payload = `${payloadFormatIndicator}${pointOfInitiationMethod}${merchantAccountInformation}${merchantCategoryCode}${transactionCurrency}${countryCode}${merchantName}${merchantCity}${additionalDataField}6304`;

  // CRC16 Checksum
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  
  const crcHex = (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  return payload + crcHex;
}
