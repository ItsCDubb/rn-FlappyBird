import { Canvas, Group, Image, useImage } from "@shopify/react-native-skia";
import { useWindowDimensions } from "react-native";

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
        x={width / 2}
        y={pipeOffset - 320}
        fit={"contain"}
      />
      <Image
        image={greenPipeBottom}
        height={640}
        width={104}
        x={width / 2}
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
