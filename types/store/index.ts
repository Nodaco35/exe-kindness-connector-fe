import { UserInfo } from '../global';

export interface StoreType {
  tabStore: [
    string | null,
    React.Dispatch<React.SetStateAction<string | null>>,
  ];
  userStore: [
    Record<string, UserInfo>,
    React.Dispatch<React.SetStateAction<Record<string, UserInfo>>>,
  ];
  spvStore: [
    Record<string, () => void>,
    React.Dispatch<React.SetStateAction<Record<string, () => void>>>,
  ];
  ucStore: [
    Record<string, () => void>,
    React.Dispatch<React.SetStateAction<Record<string, () => void>>>,
  ];
  collapsedStore: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
  listTabStore: [
    string[] | null,
    React.Dispatch<React.SetStateAction<string[] | null>>,
  ];
  routerStore: [
    string | undefined,
    React.Dispatch<React.SetStateAction<string | undefined>>,
  ];
}

export interface StoreContextType {
  tabStore: [
    string | null,
    React.Dispatch<React.SetStateAction<string | null>>,
  ];
  userStore: [
    Record<string, UserInfo>,
    React.Dispatch<React.SetStateAction<Record<string, UserInfo>>>,
  ];
  spvStore: [
    Record<string, () => void>,
    React.Dispatch<React.SetStateAction<Record<string, () => void>>>,
  ];
  ucStore: [
    Record<string, () => void>,
    React.Dispatch<React.SetStateAction<Record<string, () => void>>>,
  ];
  collapsedStore: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
  listTabStore: [
    string[] | null,
    React.Dispatch<React.SetStateAction<string[] | null>>,
  ];
  routerStore: [
    string | undefined,
    React.Dispatch<React.SetStateAction<string | undefined>>,
  ];
}
