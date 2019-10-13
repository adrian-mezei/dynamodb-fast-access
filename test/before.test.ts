import * as AWS from 'aws-sdk';
import { DatabaseConfig } from '../src/index';
import 'mocha';
import { KeyTypeEnum } from '../src/model/ConfigModels';

AWS.config.update({region: 'eu-west-1'});
AWS.config.update({credentials: {accessKeyId: 'FakeAccessKey', secretAccessKey: 'FakeSecretAccessKey'}});

const dynamoConfig = {
    apiVersion: '2012-08-10',
    region: 'local',
    endpoint: 'http://localhost:3000'
};
const DynamoDB = new AWS.DynamoDB(dynamoConfig);
const DynamoDBDocumentClient = new AWS.DynamoDB.DocumentClient(dynamoConfig);
const tableConfigs = [{
    name: 'ProductsTimestamp',
    partitionKeyName: 'id',
    partitionKeyType: KeyTypeEnum.string,
    sortKeyName: 'timestamp',
    sortKeyType: KeyTypeEnum.number,
    sortKeySeparator: '$'
},{
    name: 'ProductsDay',
    partitionKeyName: 'id',
    partitionKeyType: KeyTypeEnum.string,
    sortKeyName: 'day',
    sortKeyType: KeyTypeEnum.string,
    sortKeySeparator: '$'
}];

before('Create table', async () => {
    for(const tableConfig of tableConfigs) {
        await DynamoDB.createTable({
            TableName: tableConfig.name,
            AttributeDefinitions: [
                {
                    AttributeName: tableConfig.partitionKeyName,
                    AttributeType: tableConfig.partitionKeyType === KeyTypeEnum.number ? 'N' : 'S'
                },
                { 
                    AttributeName: tableConfig.sortKeyName,
                    AttributeType: tableConfig.sortKeyType === KeyTypeEnum.number ? 'N' : 'S'
                }
            ],
            KeySchema: [
                { 
                    AttributeName: tableConfig.partitionKeyName,
                    KeyType: 'HASH'
                },
                {
                    AttributeName: tableConfig.sortKeyName,
                    KeyType: 'SORT'
                }
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5
            }
        }).promise();
    }
});

before('Init dynamodb-fast-access object', () => {
    DatabaseConfig.init({
        apiVersion: '2012-08-10',
        maxRetries: 9,
        tables: tableConfigs
    }, DynamoDBDocumentClient);
});
