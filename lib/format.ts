export const formatPhone = (phone: string) =>
  phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');

export const formatUserName = (
  fullName?: string,
  userName?: string,
  deptName?: string,
) => {
  if (!userName) return `${fullName || ''} - ${deptName || ''}`.trim();
  if (!deptName) return `${userName} - ${fullName || ''}`.trim();
  return `${fullName || ''} - (${userName}) - ${deptName}`;
};

export const formatMoney = (money: number) =>
  (Math.round(money * 100) / 100).toLocaleString();

export const getRndInteger = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
