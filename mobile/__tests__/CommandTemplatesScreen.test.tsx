import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { CommandTemplatesScreen } from '../src/screens/CommandTemplatesScreen';

describe('CommandTemplatesScreen Component', () => {
  test('renders command templates list and action buttons without crashing', async () => {
    const onExecuteMock = jest.fn();
    let tree: any;

    await act(async () => {
      tree = renderer.create(
        <CommandTemplatesScreen onExecuteTemplate={onExecuteMock} />
      );
    });

    const instance = tree.root;
    const screen = instance.findByProps({ testID: 'command-templates-screen' });
    expect(screen).toBeTruthy();

    const addBtn = instance.findByProps({ testID: 'add-template-btn' });
    expect(addBtn).toBeTruthy();

    const defaultTpl = instance.findByProps({ testID: 'template-card-sponsorblock-remove' });
    expect(defaultTpl).toBeTruthy();
  });
});
