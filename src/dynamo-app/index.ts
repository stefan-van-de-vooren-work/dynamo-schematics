import {
    chain,
    externalSchematic,
    Rule,
    apply,
    noop,
    filter,
    url,
    template,
    move,
    mergeWith,
} from '@angular-devkit/schematics';
import { dasherize } from '@nrwl/schematics/src/utils/strings';
import { strings } from '@angular-devkit/schematics/node_modules/@angular-devkit/core';

export default function(options: any): Rule {
    console.log(options);
    const appsRoot = `./apps/${dasherize(options.name)}/src/app`;

    const templateSource = apply(url('./files'), [
        options.spec ? noop() : filter(p => !p.endsWith('.spec.ts')),
        template({
            ...strings,
            'if-flat': (s: string) => (options.flat ? '' : s),
            ...options,
        }),
        move(appsRoot),
    ]);
    return chain([
        externalSchematic('@nrwl/schematics', 'app', {
            name: options.name,
            tags: `app:${options.name}`,
            routing: true,
        }),
        mergeWith(templateSource),
    ]);
}
