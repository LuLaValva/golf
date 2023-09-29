import { A } from "@solidjs/router";

export default function Home() {
  return (
    <main>
      <h1>Golf!</h1>
      <A href="./edit">Course editor</A>
    </main>
  );
}
