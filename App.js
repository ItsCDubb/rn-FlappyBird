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
  Circle,
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
  // const redPipeTop = useImage(require("./assets/sprites/pipe-red-top.png"));
  // const redPipeBottom = useImage(
  //   require("./assets/sprites/pipe-red-bottom.png")
  // );
  const ground = useImage(require("./assets/sprites/base.png"));

  const gameOver = useSharedValue(false);
  const x = useSharedValue(width);

  // Bird State
  const birdY = useSharedValue(height / 3);
  const birdPosition = {
    x: width / 4,
  };
  const birdYVelocity = useSharedValue(0);

  // Bird Derived Values
  const birdCenterX = useDerivedValue(() => birdPosition.x + 32);
  const birdCenterY = useDerivedValue(() => birdY.value + 24);

  // Offsets
  const pipeOffset = 0;

  const obstacles = useDerivedValue(() => {
    const allObstacles = [];
    // Add Bottom Pipe
    allObstacles.push({
      x: x.value,
      y: height - 320 + pipeOffset,
      h: pipeHeight,
      w: pipeWidth,
    });
    // Add Top Pipe
    allObstacles.push({
      x: x.value,
      y: pipeOffset - 320,
      h: pipeHeight,
      w: pipeWidth,
    });
    return allObstacles;
  });

  // Animation
  const moveTheMap = () => {
    x.value = withRepeat(
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
    () => x.value,
    (currentValue, previousValue) => {
      const middle = birdPosition.x;
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
      if (currentValue > height - 100 || currentValue < 0) {
        gameOver.value = true;
      }

      const isColliding = obstacles.value.some((rect) =>
        isPointCollidingWithRect(
          { x: birdCenterX.value, y: birdCenterY.value },
          rect
        )
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
        cancelAnimation(x);
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
    x.value = width;
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
          {/* Top */}
          <Image
            image={greenPipeTop}
            height={pipeHeight}
            width={pipeWidth}
            x={x}
            y={pipeOffset - 320}
            fit={"contain"}
          />
          {/* Bottom */}
          <Image
            image={greenPipeBottom}
            height={pipeHeight}
            width={pipeWidth}
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
              x={birdPosition.x}
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
