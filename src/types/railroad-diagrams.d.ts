declare module "@prantlf/railroad-diagrams" {
  export class Diagram {
    constructor(...items: unknown[]);
    toString(): string;
  }
  export class Sequence {
    constructor(...items: unknown[]);
  }
  export class Choice {
    constructor(defaultIndex: number, ...items: unknown[]);
  }
  export class Optional {
    constructor(item: unknown);
  }
  export class OneOrMore {
    constructor(item: unknown);
  }
  export class ZeroOrMore {
    constructor(item: unknown);
  }
  export class Group {
    constructor(item: unknown, label: string);
  }
  export class Terminal {
    constructor(text: string);
  }
  export class NonTerminal {
    constructor(text: string);
  }
}
