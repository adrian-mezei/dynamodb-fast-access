import * as AWS from 'aws-sdk';

AWS.config.update({region: 'eu-west-1'});
AWS.config.update({credentials: {accessKeyId: 'FakeAccessKey', secretAccessKey: 'FakeSecretAccessKey'}});

const dynamoConfig = {
    apiVersion: '2012-08-10',
    region: 'local',
    endpoint: 'http://localhost:3000'
};
const DynamoDB = new AWS.DynamoDB(dynamoConfig);

after('Delete table', async () => {
    for(const tableName of ['ProductsTimestamp', 'ProductsDay']) {
        await DynamoDB.deleteTable({
            TableName: tableName
        }).promise();
    }
});
