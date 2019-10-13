export class DynamoDBFastAccessError extends Error {
    constructor(m: string) {
        super(m);
        this.name = 'DynamoDBFastAccessError';
    }
}
