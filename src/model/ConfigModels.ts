export interface DynamoDBConfigModel {
    apiVersion?: string;
    maxRetries: number;
    tables: DynamoDBTable[];
}

interface DynamoDBTable {
    name: string;
    partitionKeyName: string;
    partitionKeyType: KeyTypeEnum;
    sortKeyName?: string;
    sortKeyType?: KeyTypeEnum;
    sortKeySeparator?: string;
    indices?: DynamoDBIndex[];
}

export enum KeyTypeEnum {
    string = 'string',
    number = 'number'
}

export interface DynamoDBKey {
    partitionKey: string | number;
    sortKey?: string | number;
}

interface DynamoDBIndex {
    name: string;
    partitionKeyName: string;
    partitionKeyType: KeyTypeEnum;
    sortKeyName?: string;
    sortKeyType?: KeyTypeEnum;
    sortKeySeparator?: string;
}
