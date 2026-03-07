export type Hotkey = {
  windows: string;
  mac: string;
  description: string;
};

export type HotkeyCategory = {
  name: string;
  hotkeys: Hotkey[];
};

export type HotkeysContextType = {
  addPageHotkeys: (pageName: string, hotkeys: Hotkey[]) => void;
  removePageHotkeys: (pageName: string) => void;
  currentPage: string;
  setCurrentPage: (pageName: string) => void;
  openHotkeysDialog: () => void;
  closeHotkeysDialog: () => void;
  pageHotkeys: { [key: string]: HotkeyCategory };
};
