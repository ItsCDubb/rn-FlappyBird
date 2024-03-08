import {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {
  Canvas,
  Fill,
  Group,
  Image,
  matchFont,
  Text,
  useImage,
} from "@shopify/react-native-skia";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { Platform, useWindowDimensions } from "react-native";
import { useEffect, useState } from "react";

const GRAVITY = 1000;
const JUMP_FORCE = -500;

const App = () => {
  const { height, width } = useWindowDimensions();
  const [score, setScore] = useState(0);

  // Images
  const bg = useImage(require("./assets/sprites/background-night.png"));
  const bird = useImage(require("./assets/sprites/bluebird-upflap.png"));
  const greenPipeTop = useImage(require("./assets/sprites/pipe-green-top.png"));
  const greenPipeBottom = useImage(
    require("./assets/sprites/pipe-green-bottom.png")
  );
  // const redPipeTop = useImage(require("./assets/sprites/pipe-red-top.png"));
  // const redPipeBottom = useImage(
  //   require("./assets/sprites/pipe-red-bottom.png")
  // );
  const ground = useImage(require("./assets/sprites/base.png"));

  const x = useSharedValue(width);
  // Bird State
  const birdY = useSharedValue(height / 3);
  const birdPos = {
    x: width / 4,
  };
  const birdYVelocity = useSharedValue(0);

  // Animation
  useEffect(() => {
    x.value = withRepeat(
      withSequence(
        withTiming(-150, { duration: 3000, easing: Easing.linear }),
        withTiming(width, { duration: 0 })
      ),
      -1
    );
  }, []);

  useAnimatedReaction(
    () => x.value,
    (currentValue, previousValue) => {
      const middle = birdPos.x;
      if (
        currentValue !== previousValue &&
        previousValue &&
        currentValue <= middle &&
        previousValue > middle
      ) {
        // do something ✨
        runOnJS(setScore)(score + 1);
      }
    }
  );

  useFrameCallback(({ timeSincePreviousFrame: dt }) => {
    if (!dt) return;
    birdY.value = birdY.value + (birdYVelocity.value * dt) / 1000;
    birdYVelocity.value = birdYVelocity.value + (GRAVITY * dt) / 1000;
  });

  // Gestures
  const gesture = Gesture.Tap().onStart(() => {
    birdYVelocity.value = JUMP_FORCE;
  });
  // Derived Values
  const birdTransform = useDerivedValue(() => {
    return [
      {
        rotate: interpolate(
          birdYVelocity.value,
          [-500, 500],
          [-0.5, 0.5],
          Extrapolation.CLAMP
        ),
      },
    ];
  });
  const birdOrigin = useDerivedValue(() => {
    return { x: width / 4 + 32, y: birdY.value + 24 };
  });

  // Offsets
  const pipeOffset = 0;

  const fontFamily = Platform.select({ ios: "Helvetica", default: "serif" });
  const fontStyle = {
    fontFamily,
    fontSize: 40,
    fontWeight: "bold",
  };
  const font = matchFont(fontStyle);

  return (
    <GestureHandlerRootView>
      <GestureDetector gesture={gesture}>
        <Canvas style={{ height, width }}>
          {/* Background */}
          <Image image={bg} height={height} width={width} fit={"cover"} />
          {/* Pipes */}
          <Image
            image={greenPipeTop}
            height={640}
            width={104}
            x={x}
            y={pipeOffset - 320}
            fit={"contain"}
          />
          <Image
            image={greenPipeBottom}
            height={640}
            width={104}
            x={x}
            y={height - 320 + pipeOffset}
            fit={"contain"}
          />
          {/* Ground */}
          <Image
            image={ground}
            height={150}
            width={width}
            x={0}
            y={height - 75}
            fit={"cover"}
          />
          {/* Bird */}
          <Group transform={birdTransform} origin={birdOrigin}>
            <Image
              image={bird}
              height={48}
              width={64}
              x={birdPos.x}
              y={birdY}
            />
          </Group>
          {/* Score */}
          <Text
            text={score.toString()}
            x={width / 2 - 30}
            y={100}
            font={font}
          />
        </Canvas>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

export default App;
