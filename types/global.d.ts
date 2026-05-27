export {};

declare global {
  interface Window {
    tinymce: {
      activeEditor?: TinyMCEEditor;
    };
    env?: {
      API_ROOT?: string;
      API_URL: string;
      NODE_ENV: 'development' | 'production' | 'test';
      VERSION?: string;
      APP_NAME?: string;
    };
  }

  interface TinyMCEEditor {
    editorUpload: {
      blobCache: TinyMCEBlobCache;
    };
  }

  interface TinyMCEBlobCache {
    create: (id: string, file: File, base64: string) => TinyMCEBlobInfo;
    add: (blobInfo: TinyMCEBlobInfo) => void;
  }

  interface TinyMCEBlobInfo {
    id(): string;
    filename(): string;
    blob(): Blob;
    base64(): string;
    blobUri(): string; // ✅ Thêm dòng này
  }
}
export interface UserInfo {
  ID: string;
  IsRememberPassword: boolean;
  Token: string;
  ExpiredDate: string; // có thể dùng Date nếu bạn parse về Date
  CreateDate: string;
  UserID: string;
  Username: string;
  FullName: string;
  AccountType: number;
  AccountID: string;
  Avatar: string;
  Email: string;
  WardID: number;
  DistrictID: number;
  ProvinceID: number;
  Address: string;
  PhoneNumber: string;
  TimeUpdateExpiredDateToDB: string;
  Language: string | null;
  IpAddress: string;
  FileUrl: string | null;
  AccountName: string | null;
  RoleType: number;
  IsManager: boolean;
}
export interface ApiResponse<T> {
  Status: number;
  StatusCode: number;
  Object: T;
  isOk: boolean;
  isError: boolean;
}
export type ListTabResponse = ApiResponse<Tab[]>;

export interface Tab {
  CategoryID: number;
  Description: string;
  IsVistTab: boolean;
}
