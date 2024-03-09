import {
  Easing,
  Extrapolation,
  cancelAnimation,
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
const pipeHeight = 640;
const pipeWidth = 104;

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
  const ground = useImage(require("./assets/sprites/base.png"));

  const gameOver = useSharedValue(false);
  const pipeX = useSharedValue(width);

  // Bird State
  const birdY = useSharedValue(height / 3);
  const birdX = width / 4;
  const birdYVelocity = useSharedValue(0);

  // Offsets
  const pipeOffset = useSharedValue(0);

  // Pipe Derived Values
  const topPipeY = useDerivedValue(() => pipeOffset.value - 320);
  const bottomPipeY = useDerivedValue(() => height - 320 + pipeOffset.value);

  const obstacles = useDerivedValue(() => [
    // Bottom Pipe
    {
      x: pipeX.value,
      y: bottomPipeY.value,
      h: pipeHeight,
      w: pipeWidth,
    },
    // Top Pipe
    {
      x: pipeX.value,
      y: topPipeY.value,
      h: pipeHeight,
      w: pipeWidth,
    },
  ]);

  // Animation
  const moveTheMap = () => {
    pipeX.value = withRepeat(
      withSequence(
        withTiming(-150, { duration: 3000, easing: Easing.linear }),
        withTiming(width, { duration: 0 })
      ),
      -1
    );
  };

  useEffect(() => {
    moveTheMap();
  }, []);

  // Scoring system
  useAnimatedReaction(
    () => pipeX.value,
    (currentValue, previousValue) => {
      const middle = birdX;
      // Change offest of pipes
      if (previousValue && currentValue < -100 && previousValue > -100) {
        pipeOffset.value = Math.random() * 400 - 200;
      }
      if (
        currentValue !== previousValue &&
        previousValue &&
        currentValue <= middle &&
        previousValue > middle
      ) {
        runOnJS(setScore)(score + 1);
      }
    }
  );

  const isPointCollidingWithRect = (point, rect) => {
    "worklet";
    return (
      point.x >= rect.x && // right of the left edge AND
      point.x <= rect.x + rect.w && // left of the right edge AND
      point.y >= rect.y && // below the top
      point.y <= rect.y + rect.h // above the bottom
    );
  };

  // Collision detection
  useAnimatedReaction(
    () => birdY.value,
    (currentValue, previousValue) => {
      const center = {
        x: birdX + 32,
        y: birdY.value + 24,
      };
      if (currentValue > height - 100 || currentValue < 0) {
        gameOver.value = true;
      }
      const isColliding = obstacles.value.some((rect) =>
        isPointCollidingWithRect(center, rect)
      );
      if (isColliding) {
        gameOver.value = true;
      }
    }
  );

  useAnimatedReaction(
    () => gameOver.value,
    (currentValue, previousValue) => {
      if (currentValue && !previousValue) {
        cancelAnimation(pipeX);
      }
    }
  );

  useFrameCallback(({ timeSincePreviousFrame: dt }) => {
    if (!dt || gameOver.value) return;
    birdY.value = birdY.value + (birdYVelocity.value * dt) / 1000;
    birdYVelocity.value = birdYVelocity.value + (GRAVITY * dt) / 1000;
  });

  const restartGame = () => {
    "worklet";
    birdY.value = height / 3;
    birdYVelocity.value = 0;
    gameOver.value = false;
    pipeX.value = width;
    runOnJS(moveTheMap)();
    runOnJS(setScore)(0);
  };

  // Gestures
  const gesture = Gesture.Tap().onStart(() => {
    if (gameOver.value) {
      // Restart
      restartGame();
    } else {
      // Jump
      birdYVelocity.value = JUMP_FORCE;
    }
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

  // Font Decoration
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
          {/* Bottom */}
          <Image
            image={greenPipeBottom}
            height={pipeHeight}
            width={pipeWidth}
            x={pipeX}
            y={bottomPipeY}
            fit={"contain"}
          />
          {/* Top */}
          <Image
            image={greenPipeTop}
            height={pipeHeight}
            width={pipeWidth}
            x={pipeX}
            y={topPipeY}
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
            <Image image={bird} height={48} width={64} x={birdX} y={birdY} />
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
