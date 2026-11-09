import Dexie, { type Table } from 'dexie';

export interface Record {
  id?: number;
  date: string;
  type: '수입' | '지출';
  category: string;
  amount: number;
  memo: string;
}

export class MoneyMapDB extends Dexie {
  records!: Table<Record>;
  
  constructor() {
    super('MoneyMapDB');
    this.version(1).stores({
      // 날짜와 타입, 카테고리별로 빠르게 검색할 수 있도록 색인(Index) 설정
      records: '++id, date, type, category'
    });
  }
}

export const db = new MoneyMapDB();