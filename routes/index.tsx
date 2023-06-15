import Head from "../components/Head.tsx";
import Header from "../components/Header.tsx";

export default function Home() {
  return (
    <>
      <Head />
      <body>
        <Header current="Home" />
      </body>
    </>
  );
}
