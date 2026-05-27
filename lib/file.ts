export const getBase64 = (file: Blob) =>
  new Promise<string | ArrayBuffer | null>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

export const normFile = (event: any) => {
  if (Array.isArray(event)) {
    return event;
  }

  return event?.fileList;
};

export const listDataFile = (data?: any[]) =>
  data?.map(item => ({
    name: item?.FileName,
    url: item?.FileUrl,
    uid: item?.ObjectFileID,
    ...item,
  })) || [];

export const listUidFile = (data?: any[]) => {
  if (Array.isArray(data) && data.length > 0) {
    return data.map(item => item?.ObjectFileID || '');
  }

  return [''];
};
