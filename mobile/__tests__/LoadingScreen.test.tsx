import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { LoadingScreen } from '../src/screens/LoadingScreen';

describe('LoadingScreen Component', () => {
  test('renders spinner and target URL without crashing', () => {
    let tree: any;

    act(() => {
      tree = renderer.create(
        <LoadingScreen url="https://www.youtube.com/watch?v=123" />
      );
    });

    const instance = tree.root;
    const loadingScreen = instance.findByProps({ testID: 'loading-screen' });
    expect(loadingScreen).toBeTruthy();
  });
});
