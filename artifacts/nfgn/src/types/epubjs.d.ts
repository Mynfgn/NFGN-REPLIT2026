interface EpubJsRenditionOptions {
  width?: string | number;
  height?: string | number;
  spread?: string;
  flow?: string;
  snap?: boolean;
}

interface EpubJsTheme {
  [selector: string]: Record<string, string>;
}

interface EpubJsThemes {
  fontSize(size: string): void;
  register(name: string, theme: EpubJsTheme): void;
  select(name: string): void;
  override(prop: string, val: string): void;
}

interface EpubJsRendition {
  display(target?: string | number): Promise<void>;
  prev(): Promise<void>;
  next(): Promise<void>;
  themes: EpubJsThemes;
  on(event: string, handler: (...args: unknown[]) => void): void;
}

interface EpubJsBook {
  renderTo(element: Element, options?: EpubJsRenditionOptions): EpubJsRendition;
  ready: Promise<void>;
  destroy(): void;
}

interface Window {
  ePub: (url: string | ArrayBuffer | Blob, options?: Record<string, unknown>) => EpubJsBook;
}
