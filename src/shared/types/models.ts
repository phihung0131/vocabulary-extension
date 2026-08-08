// Core domain models

export interface Collocation {
  _id?: string;
  sourceWord?: string;
  collocation: string;
  ipa?: string;
  meaning?: string;
  synonyms?: string;
  anonyms?: string;
  example_en?: string;
  example_vi?: string;
  createdAt?: Date;
}

export interface ServerQueueItem {
  _id: string;
  word: string;
  createdAt: string;
}
