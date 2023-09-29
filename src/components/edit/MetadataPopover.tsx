import { JSX } from "solid-js";
import styles from "./MetadataPopover.module.css";

interface Props {
  inline: JSX.Element;
  title: string;
  children?: string | JSX.Element;
}

export default function MetadataPopover(props: Props) {
  return (
    <div class={styles.container}>
      {props.inline}
      <fieldset class={styles.popover}>
        <legend>{props.title}</legend>
        {props.children}
      </fieldset>
    </div>
  );
}
