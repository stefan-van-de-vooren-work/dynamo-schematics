import { chain, externalSchematic, Rule } from '@angular-devkit/schematics';
import { addIonicToPackageJson } from '../utils/package-json';

export default function(schema: any): Rule {
    return chain([
        externalSchematic('@nrwl/schematics', 'app', {
            name: schema.name,
            routing: true
        }),
        addIonicToPackageJson()
    ]);
}
