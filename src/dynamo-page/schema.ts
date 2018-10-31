export interface Schema {
    path?: string;
    project: string;
    name: string;
    prefix?: string;
    styleext?: string;
    spec?: boolean;
    flat?: boolean;
    selector?: string;
    routingModule?: string;
    routePath?: string;
    addRoute?: string;
}
