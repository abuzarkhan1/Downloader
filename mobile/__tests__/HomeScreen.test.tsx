import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { HomeScreen } from '../src/screens/HomeScreen';

describe('HomeScreen Component', () => {
  test('renders without crashing and displays core elements', () => {
    const onAnalyzeMock = jest.fn();
    let tree: any;
    
    act(() => {
      tree = renderer.create(<HomeScreen onAnalyze={onAnalyzeMock} />);
    });

    const instance = tree.root;
    const clipStartInput = instance.findByProps({ testID: 'clip-start-input' });
    const clipEndInput = instance.findByProps({ testID: 'clip-end-input' });
    expect(clipStartInput).toBeTruthy();
    expect(clipEndInput).toBeTruthy();
  });

  test('displays error message when passed error prop', () => {
    const onAnalyzeMock = jest.fn();
    let tree: any;

    act(() => {
      tree = renderer.create(
        <HomeScreen onAnalyze={onAnalyzeMock} error="Invalid URL entered" />
      );
    });

    const instance = tree.root;
    const errorBanner = instance.findByProps({ testID: 'home-error-banner' });
    expect(errorBanner).toBeTruthy();
  });
});
