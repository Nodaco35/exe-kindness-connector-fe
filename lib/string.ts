export const generateRandomString = () => Math.random().toString(36).slice(7);

export const getMsgClient = (message: string) =>
  message.indexOf('[!|') !== -1 && message.indexOf('|!]') !== -1
    ? message.split('[!|')[0].trim() + message.split('|!]')[1]
    : message;

export const stripHtml = (textInput?: string | null) => {
  if (!textInput) return '';
  return textInput.replace(/<\/?[^>]+(>|$)/g, '');
};

export const convertContent = (text: string) => {
  try {
    const parseText = JSON.parse(decodeHtml(text));
    return [parseText?.ActionName, parseText?.ProcessedContent]
      .join(parseText?.ActionName && parseText?.ProcessedContent ? ': ' : '')
      .concat(parseText?.SendReportHandle ? ` ${parseText?.SendReportHandle}` : '');
  } catch {
    return text;
  }
};

export const fixImplicateText = (text?: string | null) => {
  if (!text) return '';

  return text
    .replace(/↵/g, ' ')
    .replace(/(<div>|<p>)/g, '&nbsp;<span>')
    .replace(/(<\/div>|<\/p>)/g, '</span>')
    .replace(/(<div |<p )/g, '&nbsp;<span ')
    .replace(/(<br>|<br\/>|<\/br>|<br \/>)/g, ' ');
};

export const generateCode = (input?: string | null, underscore = true) => {
  if (!input) return '';

  let normalized = input.toLowerCase();
  normalized = normalized.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  normalized = normalized.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  normalized = normalized.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  normalized = normalized.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  normalized = normalized.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  normalized = normalized.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  normalized = normalized.replace(/đ/g, 'd');
  normalized = normalized.replace(
    /!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g,
    ' ',
  );
  normalized = normalized.replace(/\s+/g, ' ').trim().toUpperCase();

  const matches = normalized.match(/\b(\w)/g);
  if (!matches) return '';

  const acronym = matches.join('');
  return underscore ? `${acronym}_` : acronym;
};

const decodeHtml = (text: string) =>
  text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
