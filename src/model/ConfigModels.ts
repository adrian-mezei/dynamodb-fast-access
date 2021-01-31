export interface DynamoDBConfigModel {
    maxRetries: number;
    tables: DynamoDBTable[];
}

export interface DynamoDBTable {
    tableAlias: string;
    tableName: string;
    partitionKeyName: string;
    partitionKeyType: KeyType;
    sortKeyName?: string;
    sortKeyType?: KeyType;
    sortKeySeparator?: string;
    indices?: DynamoDBIndex[];
}

export interface DynamoDBKey {
    partitionKey: string | number;
    sortKey?: string | number;
}

interface DynamoDBIndex {
    name: string;
    partitionKeyName: string;
    partitionKeyType: KeyType;
    sortKeyName?: string;
    sortKeyType?: KeyType;
    sortKeySeparator?: string;
}

export type KeyType = 'string' | 'number';
