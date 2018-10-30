import { Tree, VirtualTree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import * as testing from '../utils/testing';

const collectionPath = path.join(__dirname, '../collection.json');

describe('dynamo-app', () => {
    let appTree: Tree;

    beforeEach(() => {
        appTree = new VirtualTree();
        appTree = testing.createEmptyWorkspace(appTree);
    });

    it('generates a nx project', () => {
        const runner = new SchematicTestRunner('dynamo-collection', collectionPath);
        const tree = runner.runSchematic('dynamo-app', { name: 'testApp' }, appTree);

        expect(tree.files.length).toBeGreaterThan(0);

        const angularJson = testing.readJsonInTree(tree, '/angular.json');

        expect(angularJson.projects['test-app'].root).toEqual('apps/test-app/');
        expect(angularJson.projects['test-app-e2e'].root).toEqual('apps/test-app-e2e/');
    });
});
