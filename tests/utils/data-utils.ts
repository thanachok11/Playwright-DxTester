/**
 * Generates a valid Thai ID number.
 */
export const generateThaiID = (): string => {
  let id: number[] = [];
  let tmp_digit: number[] = [];
  let last_digit = 0;

  for (let i = 0, operand = 13; i < 12; i++, operand--) {
    if (i === 0) {
      tmp_digit[i] = id[i] = Math.floor(Math.random() * 9) + 1;
    } else if (i === 3) {
      tmp_digit[i] = id[i] = Math.floor(Math.random() * 4) + 6;
    } else {
      tmp_digit[i] = id[i] = Math.floor(Math.random() * 10);
    }
    tmp_digit[i] = tmp_digit[i] * operand;
    last_digit += tmp_digit[i];
  }
  last_digit = last_digit % 11;
  last_digit = 11 - last_digit;
  last_digit = last_digit % 10;
  id[12] = last_digit;

  return id.join('');
};

/**
 * Generates random user data.
 */
export function generateRandomData() {
  const randomNumber = Math.floor(Math.random() * 10000);
  const now = new Date();
  const formattedDate = now.toISOString().split('T')[0];

  return {
    firstName: `ทดสอบชื่อ${randomNumber} ${formattedDate}`,
    lastName: `ทดสอบนามสกุล${randomNumber} ${formattedDate}`,
    nameTest: `NameTest${randomNumber}`,
    lastNTest: `LastNTest${randomNumber}`,
    phoneNumber: `09${randomNumber.toString().padStart(8, '0')}`,
  };
}

/**
 * Generates a datetime tick for file naming.
 */
export function generateDatetimeTick(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const milliseconds = now.getMilliseconds().toString().padStart(3, '0');

  return `${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}`;
}
