import Head from "../components/Head.tsx";
import Header from "../components/Header.tsx";

export default function Doc() {
  return (
    <>
      <Head />
      <body>
        <Header current="Doc" />
      </body>
    </>
  );
}
