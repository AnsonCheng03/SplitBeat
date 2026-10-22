declare module 'sax' {
  export interface Tag {
    name: string;
    attributes: Record<string, string>;
  }

  export interface Parser {
    onopentag?: (tag: Tag) => void;
    ontext?: (text: string) => void;
    onclosetag?: (name: string) => void;
    onerror?: (error: Error) => void;
    write(xml: string): Parser;
    close(): Parser;
    resume(): void;
  }

  export function parser(strict?: boolean, options?: { trim?: boolean }): Parser;
}
