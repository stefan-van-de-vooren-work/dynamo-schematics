export interface Schema {
    path?: string;
    applications: string;
    name: string;
    prefix?: string;
    styleext?: string;
    spec?: boolean;
    flat?: boolean;
    selector?: string;
    routingModule?: string;
    routePath?: string;
}
