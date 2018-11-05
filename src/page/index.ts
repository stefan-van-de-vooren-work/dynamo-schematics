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

import {Schema as PageOptions} from './schema';

function findRoutingModuleFromOptions(host: Tree, project: any, options: PageOptions): Path | undefined {
    const pathToCheck = `/${project.root}/src/app`
        + (options.flat ? '' : '/' + strings.dasherize(options.name));
    return normalize(findRoutingModule(host, pathToCheck, options.name));
}

function findRoutingModule(host: Tree, generateDir: string, projectName: string): Path {
    let dir: DirEntry | null = host.getDir('/' + generateDir);

    const routingModuleRe = /-routing\.module\.ts/;

    while (dir) {
        const matches = dir.subfiles.filter(p => routingModuleRe.test(p));

        if (matches.length === 1) {
            return join(dir.path, matches[0]);
        } else if (matches.length > 1) {
            throw new Error('More than one app-routing.module matches. Use --addRoute=false option to skip adding '
                + 'the route to the closest app-routing.module.');
        }

        dir = dir.parent;
    }

    throw new Error(`Project ${projectName} does not contain a app-routing.module.ts`);
}

function addRouteToNgModule(options: PageOptions): Rule {
    const {routingModule} = options;

    if (!routingModule) {
        return host => {
            return host
        };
    }

    return host => {
        const text = host.read(routingModule);

        if (!text) {
            return host;
        }

        const sourceText = text.toString('utf8');
        const source = ts.createSourceFile(routingModule, sourceText, ts.ScriptTarget.Latest, true);

        const pagePath = (
            `/${options.path}/` +
            (options.flat ? '' : `${strings.dasherize(options.name)}/`) +
            `${strings.dasherize(options.name)}.module`
        );

        const relativePath = buildRelativePath(routingModule, pagePath);

        const routePath = options.routePath ? options.routePath : options.name;
        const routeLoadChildren = `${relativePath}#${strings.classify(options.name)}PageModule`;
        const changes = addRouteToRoutesArray(source, routingModule, routePath, routeLoadChildren);
        const recorder = host.beginUpdate(routingModule);

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

        if (!options.applications) {
            throw new SchematicsException('application option is required.');
        }

        const apps: string[] = options.applications.split(',');
        const workspace = getWorkspace(host);
        let appPrefix: string = '';

        const rules = apps.map(app => {

            const project = workspace.projects[app];
            appPrefix = project.prefix;
            options.routingModule = findRoutingModuleFromOptions(host, project, options);

            return addRouteToNgModule(options);

        });

        options.prefix = apps.length>1 ? options.prefix : appPrefix;
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
