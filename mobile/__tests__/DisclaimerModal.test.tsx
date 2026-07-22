import React from 'react';
import renderer, { act } from 'react-test-renderer';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { DisclaimerModal } from '../src/components/DisclaimerModal';
import { getDisclaimerAcceptedAt } from '../src/services/storage';

describe('DisclaimerModal Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders correctly when visible is true', () => {
    const onAcceptMock = jest.fn();
    let tree: any;

    act(() => {
      tree = renderer.create(<DisclaimerModal visible={true} onAccept={onAcceptMock} />);
    });

    expect(tree.toJSON()).toBeTruthy();
  });

  test('accept button is disabled when checkbox is unchecked', () => {
    const onAcceptMock = jest.fn();
    let tree: any;

    act(() => {
      tree = renderer.create(<DisclaimerModal visible={true} onAccept={onAcceptMock} />);
    });

    const instance = tree.root;
    const acceptBtn = instance.findByProps({ testID: 'disclaimer-accept-btn' });
    expect(acceptBtn.props.disabled).toBe(true);
  });

  test('enables accept button when checkbox is checked and calls onAccept with timestamp on press', async () => {
    const onAcceptMock = jest.fn();
    let tree: any;

    act(() => {
      tree = renderer.create(<DisclaimerModal visible={true} onAccept={onAcceptMock} />);
    });

    const instance = tree.root;
    const checkbox = instance.findByProps({ testID: 'disclaimer-checkbox' });
    const acceptBtn = instance.findByProps({ testID: 'disclaimer-accept-btn' });

    // Toggle checkbox
    await act(async () => {
      checkbox.props.onPress();
    });

    expect(acceptBtn.props.disabled).toBe(false);

    // Press Accept Button
    await act(async () => {
      await acceptBtn.props.onPress();
    });

    expect(onAcceptMock).toHaveBeenCalledTimes(1);

    // Verify storage saved
    const savedTimestamp = await getDisclaimerAcceptedAt();
    expect(savedTimestamp).toBeTruthy();
  });
});
