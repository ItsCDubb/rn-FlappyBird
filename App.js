import { Canvas, Group, Image, useImage } from "@shopify/react-native-skia";
import { useEffect } from "react";
import { useWindowDimensions } from "react-native";
import {
  Easing,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const App = () => {
  const { height, width } = useWindowDimensions();
  // Images
  const bg = useImage(require("./assets/sprites/background-day.png"));
  const bird = useImage(require("./assets/sprites/bluebird-upflap.png"));
  const greenPipeTop = useImage(require("./assets/sprites/pipe-green-top.png"));
  const greenPipeBottom = useImage(
    require("./assets/sprites/pipe-green-bottom.png")
  );
  const redPipeTop = useImage(require("./assets/sprites/pipe-red-top.png"));
  const redPipeBottom = useImage(
    require("./assets/sprites/pipe-red-bottom.png")
  );
  const ground = useImage(require("./assets/sprites/base.png"));

  const x = useSharedValue(width - 50);

  useEffect(() => {
    x.value = withRepeat(
      withSequence(
        withTiming(-150, { duration: 3000, easing: Easing.linear }),
        withTiming(width, { duration: 0 })
      ),
      -1
    );
  }, []);

  const pipeOffset = 0;

  return (
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
      <Image image={bird} height={48} width={64} x={width / 4} y={height / 2} />
    </Canvas>
  );
};

export default App;
