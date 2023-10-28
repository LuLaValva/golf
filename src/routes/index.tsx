import { A } from "@solidjs/router";
import styles from "./homepage.module.css";

export default function Home() {
  return (
    <main class={styles.main}>
      <h1 class={styles.title}>
        G
        <span class={styles.ball}>
          <img
            src="/ball.svg"
            alt='Golf ball used to represent an "o"'
            class={styles.ball}
          />
        </span>
        lf!
      </h1>
      <A href="/editor">Course editor</A>
    </main>
  );
}
