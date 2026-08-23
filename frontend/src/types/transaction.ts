export interface ParsedTransaction {
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  rawInput: string;
}

export type ParseErrorCode =
  | 'empty'
  | 'missing-name'
  | 'incomplete-price'
  | 'unrecognized';

export interface ParseFailure {
  ok: false;
  code: ParseErrorCode;
  message: string;
  hint: string;
  rawInput: string;
}

export interface ParseSuccess {
  ok: true;
  value: ParsedTransaction;
}

export type ParseResult = ParseSuccess | ParseFailure;
