import { Tree } from '@angular-devkit/schematics';
import * as stripJsonComments from 'strip-json-comments';

// https://github.com/nrwl/nx/blob/master/packages/schematics/src/utils/ast-utils.ts#L573
/**
 * This method is specifically for reading JSON files in a Tree
 * @param host The host tree
 * @param path The path to the JSON file
 * @returns The JSON data in the file.
 */
export function readJsonInTree<T = any>(host: Tree, path: string): T {
    if (!host.exists(path)) {
        throw new Error(`Cannot find ${path}`);
    }

    return JSON.parse(stripJsonComments(host.read(path).toString('utf-8')));
}

// https://github.com/nrwl/nx/blob/master/packages/schematics/src/utils/testing-utils.ts#L24
export function createEmptyWorkspace(tree: Tree): Tree {
    tree.create('/angular.json', JSON.stringify({ projects: {}, newProjectRoot: '' }));
    tree.create(
        '/package.json',
        JSON.stringify({
            dependencies: {},
            devDependencies: {}
        })
    );
    tree.create('/nx.json', JSON.stringify({ npmScope: 'proj', projects: {} }));
    tree.create('/tsconfig.json', JSON.stringify({ compilerOptions: { paths: {} } }));
    tree.create(
        '/tslint.json',
        JSON.stringify({
            rules: {
                'nx-enforce-module-boundaries': [
                    true,
                    {
                        npmScope: '<%= npmScope %>',
                        lazyLoad: [],
                        allow: []
                    }
                ]
            }
        })
    );
    return tree;
}
