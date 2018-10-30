import { Tree } from '@angular-devkit/schematics';

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
