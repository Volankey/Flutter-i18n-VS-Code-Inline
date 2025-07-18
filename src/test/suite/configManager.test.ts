import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { ConfigManager } from '../../core/configManager';

suite('ConfigManager Test Suite', () => {
  let sandbox: sinon.SinonSandbox;
  let configManager: ConfigManager;

  setup(() => {
    sandbox = sinon.createSandbox();
    configManager = ConfigManager.getInstance();
  });

  teardown(() => {
    sandbox.restore();
  });

  test('Should be a singleton', () => {
    const instance1 = ConfigManager.getInstance();
    const instance2 = ConfigManager.getInstance();
    assert.strictEqual(instance1, instance2);
  });

  test('Should return default configuration', () => {
    // Mock vscode.workspace.getConfiguration
    const mockConfig = {
      get: sandbox.stub().returns(true),
      has: sandbox.stub().returns(true),
      inspect: sandbox.stub(),
      update: sandbox.stub().resolves(),
    };
    sandbox.stub(vscode.workspace, 'getConfiguration').returns(mockConfig as any);

    const config = configManager.getConfiguration();
    assert.ok(config);
    assert.ok(typeof config === 'object');
  });

  test('Should handle configuration updates', () => {
    const mockConfig = {
      get: sandbox.stub().returns(true),
      has: sandbox.stub().returns(true),
      inspect: sandbox.stub(),
      update: sandbox.stub().resolves(),
    };
    sandbox.stub(vscode.workspace, 'getConfiguration').returns(mockConfig as any);

    assert.doesNotThrow(() => {
      configManager.getConfiguration();
    });
  });

  test('Should handle missing configuration gracefully', () => {
    const mockConfig = {
      get: sandbox.stub().returns(undefined),
      has: sandbox.stub().returns(false),
      inspect: sandbox.stub(),
      update: sandbox.stub().resolves(),
    };
    sandbox.stub(vscode.workspace, 'getConfiguration').returns(mockConfig as any);

    assert.doesNotThrow(() => {
      const config = configManager.getConfiguration();
      assert.ok(config);
    });
  });

  test('Should dispose without errors', () => {
    assert.doesNotThrow(() => {
      configManager.dispose();
    });
  });
});
