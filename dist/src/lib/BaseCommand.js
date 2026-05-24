"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class BaseCommand {
    constructor(client, handler, config) {
        this.client = client;
        this.handler = handler;
        this.config = config;
        //eslint-disable-next-line @typescript-eslint/no-unused-vars
        this.run = (M, parsedArgs) => {
            throw new Error('run method should be defined');
        };
    }
}
exports.default = BaseCommand;
