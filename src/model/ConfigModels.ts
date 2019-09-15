export interface DynamoDBConfigModel {
    apiVersion: string;
    maxRetries: number;
    tables: DynamoDBTable[];
}

interface DynamoDBTable {
    name: string;
    partitionKeyName: string;
    partitionKeyType: string;
    sortKeyName?: string;
    sortKeyType?: string;
    indices?: DynamoDBIndex[];
}

interface DynamoDBIndex {
    name: string;
    dynamoDBIndexName: string;
    partitionKeyName: string;
    sortKeyName?: string;
};
