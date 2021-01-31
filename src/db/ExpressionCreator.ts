import { DynamoDB } from 'aws-sdk';

export class ExpressionCreator {
    public static getUpdateExpression(attributes: object): DynamoDB.DocumentClient.UpdateExpression {
        const attrib: any = attributes;
        let expression = '';

        Object.keys(attrib).forEach(field => {
            if (attrib[field] !== undefined) {
                if (expression !== '') expression += ', ';
                expression += '#' + field + ' = ' + ':' + field;
            }
        });

        return expression;
    }

    public static getUpdateExpressionRemove(attributes: string[]): DynamoDB.DocumentClient.UpdateExpression {
        let expression = '';

        for (const attribute of attributes) {
            if (attribute !== '') {
                if (expression !== '') expression += ', ';
                expression += '#' + attributes;
            }
        }

        return expression;
    }

    public static getFilterExpression(attributes: object): DynamoDB.DocumentClient.ConditionExpression {
        const attrib: any = attributes;
        let expression = '';

        Object.keys(attrib).forEach(field => {
            if (attrib[field] !== undefined) {
                if (expression !== '') expression += ' and ';
                expression += '#' + field + ' = ' + ':' + field;
            }
        });

        return expression;
    }

    public static getExpressionAttributeValues(
        attributes: object,
    ): DynamoDB.DocumentClient.ExpressionAttributeValueMap {
        const attrib: any = attributes;
        const expression: any = {};

        Object.keys(attrib).forEach(field => {
            if (attrib[field] !== undefined) {
                expression[':' + field] = attrib[field];
            }
        });

        return expression;
    }

    public static getExpressionAttributeNames(attributes: object): DynamoDB.DocumentClient.ExpressionAttributeNameMap {
        const attrib: any = attributes;
        const expression: any = {};

        Object.keys(attrib).forEach(field => {
            if (attrib[field] !== undefined) {
                expression['#' + field] = field;
            }
        });

        return expression;
    }
}
