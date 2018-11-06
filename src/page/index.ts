import * as ts from 'typescript';

import {Path, join, normalize, strings} from '@angular-devkit/core';

import {
    DirEntry,
    Rule,
    SchematicsException,
    Tree,
    apply,
    branchAndMerge,
    chain,
    filter,
    mergeWith,
    move,
    noop,
    template,
    url,
} from '@angular-devkit/schematics';

import {findNodes} from '@schematics/angular/utility/ast-utils';
import {Change, InsertChange} from '@schematics/angular/utility/change';
import {getWorkspace} from '@schematics/angular/utility/config';
import {buildRelativePath} from '@schematics/angular/utility/find-module';
import {parseName} from '@schematics/angular/utility/parse-name';
import {validateHtmlSelector, validateName} from '@schematics/angular/utility/validation';
import { readJsonInTree} from "../utils/json";

import {Schema as PageOptions} from './schema';

function findModule(host: Tree, generateDir: string, pageModule: boolean): Path {
    let dir: DirEntry | null = host.getDir('/' + generateDir);

    const moduleRe = pageModule ? /\.module\.ts/ : /-routing\.module\.ts/;

    while (dir) {
        const matches = dir.subfiles.filter(p => moduleRe.test(p));

        if (matches.length === 1) {
            return normalize(join(dir.path, matches[0]));
        } else if (matches.length > 1) {
            throw new Error(generateDir + ' contains more then one module');
        }

        dir = dir.parent;
    }

    throw new Error(generateDir + (pageModule ? ' does not exist or does not contain a module' : ' does not contain a app-routing.module.ts'));
}

function addRouteToNgModule(options: PageOptions): Rule {
    const {module} = options;

    if (!module) {
        return host => {
            return host
        };
    }

    return host => {
        const text = host.read(module);

        if (!text) {
            return host;
        }

        const sourceText = text.toString('utf8');
        const source = ts.createSourceFile(module, sourceText, ts.ScriptTarget.Latest, true);

        const pagePath = (
            `/${options.path}/` +
            (options.flat ? '' : `${strings.dasherize(options.name)}/`) +
            `${strings.dasherize(options.name)}.module`
        );

        const relativePath = buildRelativePath(module, pagePath);

        const routePath = options.routePath ? options.routePath : options.name;
        const routeLoadChildren = `${relativePath}#${strings.classify(options.name)}PageModule`;
        const changes = addRouteToRoutesArray(source, module, routePath, routeLoadChildren);
        const recorder = host.beginUpdate(module);

        for (const change of changes) {
            if (change instanceof InsertChange) {
                recorder.insertLeft(change.pos, change.toAdd);
            }
        }

        host.commitUpdate(recorder);

        return host;
    };
}

function addRouteToRoutesArray(source: ts.SourceFile, ngModulePath: string, routePath: string, routeLoadChildren: string): Change[] {
    const keywords = findNodes(source, ts.SyntaxKind.VariableStatement);

    for (const keyword of keywords) {

        if (ts.isVariableStatement(keyword)) {
            const [declaration] = keyword.declarationList.declarations;

            if (ts.isVariableDeclaration(declaration) && declaration.initializer && declaration.name.getText() === 'routes') {

                const node = declaration.initializer.getChildAt(1); // the content node of the array
                const lastRouteNode = node.getLastToken(); // if the content node has content

                const pos = lastRouteNode ? lastRouteNode.getEnd() : node.getEnd();

                const changes: Change[] = [];
                let trailingCommaFound = false;

                if (lastRouteNode) {
                    if (lastRouteNode.kind === ts.SyntaxKind.CommaToken) {
                        trailingCommaFound = true;
                    } else {
                        changes.push(new InsertChange(ngModulePath, pos, ','));
                    }

                    changes.push(new InsertChange(ngModulePath, pos + 1, `   { path: '${routePath}', loadChildren: '${routeLoadChildren}' }${trailingCommaFound ? ',' : ''}\n`));
                } else {
                    changes.push(new InsertChange(ngModulePath, pos, `\n   { path: '${routePath}', loadChildren: '${routeLoadChildren}' }\n`));
                }

                return changes;
            }
        }
    }

    return [];
}

function buildSelector(options: PageOptions, projectPrefix: string) {
    let selector = strings.dasherize(options.name);

    if (options.prefix) {
        selector = `${options.prefix}-${selector}`;
    } else if (options.prefix === undefined && projectPrefix) {
        selector = `${projectPrefix}-${selector}`;
    }

    return selector;
}

export default function (options: PageOptions): Rule {
    return (host, context) => {

        if (!options.apps && !options.page) {
            throw new SchematicsException('apps or page option is required.');
        }

        let rules: Rule[] = [];

        if(options.apps){
            const apps: string[] = options.apps.split(',');
            const workspace = getWorkspace(host);
            let appPrefix = '';

            rules = apps.map(app => {

                const project = workspace.projects[app];
                appPrefix = project.prefix;

                const pathToCheck = `/${project.root}src/app/` + strings.dasherize(app);

                options.module = findModule(host, pathToCheck, false);

                return addRouteToNgModule(options);

            });

            options.prefix = apps.length>1 ? options.prefix : appPrefix;

        }else if(options.page){

            const pathToCheck = options.path + options.page;
            const parentPageConfig = readJsonInTree(host, pathToCheck + '/' + options.page + '.page.json');
            options.prefix = parentPageConfig.prefix;

            options.module = findModule(host, pathToCheck, true);
            options.path = (options.path || '') + options.page + '/';
            rules.push(addRouteToNgModule(options));
        }

        options.selector = options.selector ? options.selector : buildSelector(options, '');

        const parsedPath = parseName(options.path || '', options.name);
        options.name = parsedPath.name;
        options.path = parsedPath.path;

        validateName(options.name);
        validateHtmlSelector(options.selector);

        const templateSource = apply(url('./files'), [
            options.spec ? noop() : filter(p => !p.endsWith('.spec.ts')),
            template({
                ...strings,
                'if-flat': (s: string) => options.flat ? '' : s,
                ...options,
            }),
            move(parsedPath.path),
        ]);

        rules.push(mergeWith(templateSource));

        return chain([
            branchAndMerge(chain(rules)),
        ])(host, context);
    };
}
