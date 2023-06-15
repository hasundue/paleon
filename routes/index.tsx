import Head from "../components/Head.tsx";
import Header from "../components/Header.tsx";

export default function Home() {
  return (
    <>
      <Head />
      <body>
        <Header current="Home" />

        <div style="text-align: center">
          <h1>
            Paleon
          </h1>
          <p>
            A logging service and library with <b>Deno Deploy</b> and{" "}
            <b>Deno KV</b>.
          </p>
        </div>

        <div style="display: flex; justify-content: center; align-items: center;">
          <img src="/logo.png" alt="Paleon Logo" />
        </div>

        <section>
          <div style="text-align: center">
            <p>
              Developed for{" "}
              <a href="https://github.com/denoland/deno-kv-hackathon">
                Deno KV Hackathon
              </a>
            </p>
          </div>
        </section>
      </body>
    </>
  );
}
