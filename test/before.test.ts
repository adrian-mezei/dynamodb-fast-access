import * as AWS from 'aws-sdk';
import { DatabaseConfig } from '../src/index';
import 'mocha';
import { DynamoDBTable } from '../src/model/ConfigModels';

AWS.config.update({ region: 'eu-west-1' });
AWS.config.update({ credentials: { accessKeyId: 'FakeAccessKey', secretAccessKey: 'FakeSecretAccessKey' } });

const dynamoConfig = {
    apiVersion: '2012-08-10',
    region: 'local',
    endpoint: 'http://localhost:3000',
};
const DynamoDB = new AWS.DynamoDB(dynamoConfig);
const DynamoDBDocumentClient = new AWS.DynamoDB.DocumentClient(dynamoConfig);
const tableConfigs: DynamoDBTable[] = [
    {
        tableAlias: 'ProductsTimestamp',
        tableName: 'ProductsTimestamp',
        partitionKeyName: 'id',
        partitionKeyType: 'string',
        sortKeyName: 'timestamp',
        sortKeyType: 'number',
        sortKeySeparator: '$',
    },
    {
        tableAlias: 'ProductsDay',
        tableName: 'ProductsDay',
        partitionKeyName: 'id',
        partitionKeyType: 'string',
        sortKeyName: 'day',
        sortKeyType: 'string',
        sortKeySeparator: '$',
    },
];

before('Create table', async () => {
    for (const tableConfig of tableConfigs) {
        await DynamoDB.createTable({
            TableName: tableConfig.tableName,
            AttributeDefinitions: [
                {
                    AttributeName: tableConfig.partitionKeyName,
                    AttributeType: tableConfig.partitionKeyType === 'number' ? 'N' : 'S',
                },
                {
                    AttributeName: tableConfig.sortKeyName,
                    AttributeType: tableConfig.sortKeyType === 'number' ? 'N' : 'S',
                },
            ],
            KeySchema: [
                {
                    AttributeName: tableConfig.partitionKeyName,
                    KeyType: 'HASH',
                },
                {
                    AttributeName: tableConfig.sortKeyName,
                    KeyType: 'SORT',
                },
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5,
            },
        } as AWS.DynamoDB.CreateTableInput).promise();
    }
});

before('Init dynamodb-fast-access object', () => {
    DatabaseConfig.init(
        {
            maxRetries: 9,
            tables: tableConfigs,
        },
        DynamoDBDocumentClient,
    );
});
