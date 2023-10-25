import { A } from "@solidjs/router";

export default function Home() {
  return (
    <main>
      <h1>Golf!</h1>
      <A href="/editor">Course editor</A>
    </main>
  );
}
