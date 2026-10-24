import { useCallback, useEffect, useRef, type RefObject } from "react";
import {
  Keyboard,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView,
  type TextInput,
} from "react-native";

type InputRevealOptions = {
  scrollRef: RefObject<ScrollView | null>;
  getInput: () => TextInput | null | undefined;
  topInset?: number;
  bottomInset?: number;
  deferToAnimationFrame?: boolean;
};

/** Reveal a focused input within the ScrollView's actual viewport.
 * Keep getInput stable with useCallback; insets include overlays and spacing.
 */
export default function useInputReveal({
  scrollRef,
  getInput,
  topInset = 8,
  bottomInset = 8,
  deferToAnimationFrame = false,
}: InputRevealOptions) {
  const scrollOffset = useRef(0);
  const revealRequest = useRef(0);
  const revealFrame = useRef<number | null>(null);

  const revealInput = useCallback(() => {
    const request = ++revealRequest.current;
    const measure = () => {
      const input = getInput();
      const scroll = scrollRef.current;
      if (!input?.isFocused() || !scroll) return;
      // Measure both views in window coordinates, including nested Modals.
      scroll
        .getNativeScrollRef()
        ?.measureInWindow(
          (_x: number, y: number, _width: number, height: number) => {
            input.measureInWindow((_inputX, inputY, _inputWidth, inputHeight) => {
              if (
                request !== revealRequest.current ||
                getInput() !== input ||
                !input.isFocused()
              )
                return;
              const visibleTop = y + topInset;
              const visibleBottom = y + height - bottomInset;
              const delta =
                inputY + inputHeight > visibleBottom
                  ? inputY + inputHeight - visibleBottom
                  : inputY < visibleTop
                    ? inputY - visibleTop
                    : 0;
              if (Math.abs(delta) > 1)
                scroll.scrollTo({
                  y: Math.max(0, scrollOffset.current + delta),
                  animated: false,
                });
            });
          },
        );
    };

    if (deferToAnimationFrame) {
      if (revealFrame.current !== null)
        cancelAnimationFrame(revealFrame.current);
      revealFrame.current = requestAnimationFrame(() => {
        revealFrame.current = null;
        measure();
      });
    } else {
      measure();
    }
  }, [scrollRef, getInput, topInset, bottomInset, deferToAnimationFrame]);

  const cancelReveal = useCallback(() => {
    revealRequest.current++;
    if (revealFrame.current !== null) {
      cancelAnimationFrame(revealFrame.current);
      revealFrame.current = null;
    }
  }, []);

  useEffect(() => {
    const subscription = Keyboard.addListener("keyboardDidShow", revealInput);
    return () => {
      subscription.remove();
      cancelReveal();
    };
  }, [revealInput, cancelReveal]);

  const onScroll = useCallback(
    ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollOffset.current = nativeEvent.contentOffset.y;
    },
    [],
  );

  return { revealInput, onScroll };
}
