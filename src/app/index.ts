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
    MergeStrategy,
} from '@angular-devkit/schematics';
import { dasherize } from '@nrwl/schematics/src/utils/strings';
import { strings } from '@angular-devkit/core';

export default function(options: any): Rule {
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
        mergeWith(templateSource, MergeStrategy.Overwrite),
    ]);
}
