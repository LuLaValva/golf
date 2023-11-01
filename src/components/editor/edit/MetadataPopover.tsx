import { JSX, createSignal } from "solid-js";
import styles from "./MetadataPopover.module.css";

interface Props {
  inline: JSX.Element;
  title: string;
  children?: string | JSX.Element;
}

export default function MetadataPopover(props: Props) {
  const [open, setOpen] = createSignal(false);
  return (
    <div
      classList={{ [styles.container]: true, [styles.open]: open() }}
      onFocusIn={() => setOpen(true)}
      onFocusOut={(e) => {
        if (
          e.relatedTarget === null ||
          !e.currentTarget.contains(e.relatedTarget as Element)
        )
          setOpen(false);
      }}
      tabindex="0" // this is a workaround for a bug in Safari (focus events won't trigger without a tabindex)
    >
      {props.inline}
      <fieldset class={styles.popover}>
        <legend>{props.title}</legend>
        {props.children}
      </fieldset>
    </div>
  );
}
