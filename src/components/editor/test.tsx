import { useContext } from "solid-js";
import { EditorContext } from "../../routes/editor";
import Game from "~/components/game/Game";

export default function TestMode() {
  const { data, setSvgBody, scrollTo, mainRef } = useContext(EditorContext)!;

  return (
    <Game
      data={data}
      setSvgBody={setSvgBody}
      scrollTo={scrollTo}
      scrollRef={mainRef}
      onScore={(stage) => {
        stage.reset();
        return true;
      }}
    />
  );
}
