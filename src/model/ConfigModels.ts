export interface DynamoDBConfigModel {
    apiVersion?: string;
    maxRetries: number;
    tables: DynamoDBTable[];
}

interface DynamoDBTable {
    name: string;
    partitionKeyName: string;
    partitionKeyType: 'string' | 'binary' | 'number';
    sortKeyName?: string;
    sortKeyType?: string;
    sortKeySeparator?: string;
    indices?: DynamoDBIndex[];
}

interface DynamoDBIndex {
    name: string;
    partitionKeyName: string;
    partitionKeyType: 'string' | 'binary' | 'number';
    sortKeyName?: string;
    sortKeyType?: string;
    sortKeySeparator?: string;
}
