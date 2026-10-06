import { SmoothScroll } from "@/components/site/SmoothScroll";
import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { Marquee } from "@/components/site/Marquee";
import { Services } from "@/components/site/Services";
import { Process } from "@/components/site/Process";
import { Booking } from "@/components/site/Booking";
import { Faq } from "@/components/site/Faq";
import { Contact } from "@/components/site/Contact";
import { Footer } from "@/components/site/Footer";

export default function Home() {
  return (
    <SmoothScroll>
      <div className="grain relative bg-[#0B0E14] text-white" data-testid="home-page">
        <Header />
        <main>
          <Hero />
          <Marquee />
          <Services />
          <Process />
          <Booking />
          <Faq />
          <Contact />
        </main>
        <Footer />
      </div>
    </SmoothScroll>
  );
}
