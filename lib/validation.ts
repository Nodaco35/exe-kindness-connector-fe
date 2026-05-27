export const SYMBOLS_REGEX =
  /!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|`|-|{|}|\||\\/g;

export const getRegexPassword = () =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/;

export const getRegexUsername = () => /^[a-zA-Z0-9_]{3,16}$/;

export const getRegexEmail = () =>
  /^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/;

export const getRegexPhoneNumber = () => /^(\+84|84|0)+(9|3|7|8|5)+([0-9]{8})\b/g;

export const getRegexMobile = () => /^([0-9]{8,15})\b/g;

export const getRegexGPA = () => /^(?:[0-3](?:\.\d{1,2})?|4(?:\.0{1,2})?)$/;

export const validateEmail = (email: string) =>
  getRegexEmail().test(String(email).toLowerCase());

export const validateMobile = (mobile: string) =>
  getRegexMobile().test(String(mobile).toLowerCase());

export const validatePhone = (phone: string) => {
  if (
    ((phone.startsWith('01') ||
      phone.startsWith('028') ||
      phone.startsWith('023') ||
      phone.startsWith('02')) &&
      phone.length === 11) ||
    ((phone.startsWith('03') ||
      phone.startsWith('05') ||
      phone.startsWith('07') ||
      phone.startsWith('08') ||
      phone.startsWith('09')) &&
      phone.length === 10)
  ) {
    return true;
  }

  return false;
};
